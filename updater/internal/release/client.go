package release

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
	"unicode/utf8"
)

type bounds struct {
	json, archive, file, expanded, directory int64
	entries, assets                          int
}

func defaultBounds() bounds {
	return bounds{json: 2 << 20, archive: 256 << 20, file: 128 << 20,
		expanded: 1 << 30, directory: 16 << 20, entries: 20000, assets: 1000}
}

type client struct {
	http   *http.Client
	base   string
	limits bounds
}

// client/base injection is private and only used by offline HTTP tests. Public
// entrypoints always create their own transport and use the fixed HTTPS API.
func newClient(injected *http.Client, base string) *client {
	var h http.Client
	if injected != nil {
		h = *injected
	} else {
		h.Transport = &http.Transport{
			DialContext:         (&net.Dialer{Timeout: 30 * time.Second, KeepAlive: 30 * time.Second}).DialContext,
			TLSClientConfig:     &tls.Config{MinVersion: tls.VersionTLS12},
			TLSHandshakeTimeout: 10 * time.Second, ResponseHeaderTimeout: 30 * time.Second,
			IdleConnTimeout: 30 * time.Second, MaxIdleConns: 4,
			MaxResponseHeaderBytes: 64 << 10, DisableCompression: true,
		}
	}
	h.Timeout = 90 * time.Second
	h.Jar = nil
	h.CheckRedirect = func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }
	return &client{http: &h, base: strings.TrimSuffix(base, "/"), limits: defaultBounds()}
}

func (c *client) list(ctx context.Context, version string) (Listing, error) {
	var listing Listing
	if err := validateVersion(version); err != nil {
		return listing, err
	}
	resp, err := c.get(ctx, repositoryPath+"tags/"+version, "application/vnd.github+json", false)
	if err != nil {
		return listing, err
	}
	defer resp.Body.Close()
	if resp.ContentLength > c.limits.json {
		return listing, fmt.Errorf("release JSON exceeds limit")
	}
	var raw bytes.Buffer
	if _, err = copyBounded(ctx, &raw, resp.Body, c.limits.json); err != nil {
		return listing, fmt.Errorf("release JSON: %w", err)
	}
	if err = checkJSON(raw.Bytes()); err != nil {
		return listing, err
	}
	var release struct {
		Tag        string   `json:"tag_name"`
		Draft      *bool    `json:"draft"`
		Prerelease *bool    `json:"prerelease"`
		Assets     *[]Asset `json:"assets"`
	}
	if err = json.Unmarshal(raw.Bytes(), &release); err != nil {
		return listing, fmt.Errorf("invalid release JSON: %w", err)
	}
	if release.Tag != version || release.Draft == nil || release.Prerelease == nil || *release.Draft || *release.Prerelease {
		return listing, fmt.Errorf("release must match the requested tag and explicitly be neither draft nor prerelease")
	}
	if release.Assets == nil || len(*release.Assets) > c.limits.assets {
		return listing, fmt.Errorf("missing or excessive release attachments")
	}
	names, ids := map[string]bool{}, map[int64]bool{}
	for _, a := range *release.Assets {
		name := strings.ToLower(a.Name)
		if a.ID <= 0 || a.Name == "" || len(a.Name) > 255 || a.Size < 0 || names[name] || ids[a.ID] {
			return listing, fmt.Errorf("invalid or ambiguous release attachment metadata")
		}
		names[name], ids[a.ID] = true, true
	}
	return Listing{Repository: repository, Version: version, Assets: *release.Assets}, nil
}

// Handle redirects ourselves so cookies, authorization, API headers, and a
// Referer can never be inherited across hosts, even with an injected client.
func (c *client) get(ctx context.Context, path, accept string, asset bool) (*http.Response, error) {
	target := c.base + path
	deadline, cancel := context.WithTimeout(ctx, c.http.Timeout)
	for hop := 0; ; hop++ {
		req, err := http.NewRequestWithContext(deadline, http.MethodGet, target, nil)
		if err != nil {
			cancel()
			return nil, fmt.Errorf("invalid download URL")
		}
		req.Header.Set("Accept", accept)
		req.Header.Set("User-Agent", "cc-radt-updater")
		if hop == 0 {
			req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
		}
		resp, err := c.http.Do(req)
		if err != nil {
			contextErr := deadline.Err()
			cancel()
			// Do not expose signed redirect URLs in user-visible errors.
			if contextErr != nil {
				return nil, fmt.Errorf("release request: %w", contextErr)
			}
			return nil, fmt.Errorf("release request failed (transport or TLS error)")
		}
		if resp.StatusCode == http.StatusOK {
			if encoding := resp.Header.Get("Content-Encoding"); encoding != "" && encoding != "identity" {
				resp.Body.Close()
				cancel()
				return nil, fmt.Errorf("unexpected HTTP content encoding")
			}
			resp.Body = &cancelBody{ReadCloser: resp.Body, cancel: cancel}
			return resp, nil
		}
		resp.Body.Close()
		switch resp.StatusCode {
		case 301, 302, 303, 307, 308:
			location, locationErr := resp.Location()
			if !asset || hop >= 5 || locationErr != nil || !allowedRedirect(location) {
				cancel()
				return nil, fmt.Errorf("release redirect refused")
			}
			target = location.String()
		default:
			cancel()
			return nil, fmt.Errorf("GitHub release request returned HTTP %d", resp.StatusCode)
		}
	}
}

type cancelBody struct {
	io.ReadCloser
	cancel context.CancelFunc
}

func (b *cancelBody) Close() error { err := b.ReadCloser.Close(); b.cancel(); return err }

func allowedRedirect(u *url.URL) bool {
	if u == nil || u.Scheme != "https" || u.User != nil || u.Fragment != "" || u.Opaque != "" || (u.Port() != "" && u.Port() != "443") {
		return false
	}
	switch u.Hostname() {
	case "objects.githubusercontent.com", "release-assets.githubusercontent.com":
		return true
	}
	return false
}

// Standard JSON decoding silently accepts duplicate and case-aliased keys.
// Reject them first, with explicit nesting and total-byte bounds.
func checkJSON(raw []byte) error {
	if !utf8.Valid(raw) {
		return fmt.Errorf("release JSON is not UTF-8")
	}
	d := json.NewDecoder(bytes.NewReader(raw))
	d.UseNumber()
	var value func(int) error
	value = func(depth int) error {
		if depth > 64 {
			return fmt.Errorf("release JSON nesting exceeds limit")
		}
		token, err := d.Token()
		if err != nil {
			return err
		}
		switch token {
		case json.Delim('{'):
			keys := map[string]bool{}
			for d.More() {
				key, err := d.Token()
				if err != nil {
					return err
				}
				name, ok := key.(string)
				for _, ch := range name {
					if ch > 127 {
						return fmt.Errorf("non-ASCII release JSON key")
					}
				}
				name = strings.ToLower(name)
				if !ok || keys[name] {
					return fmt.Errorf("duplicate release JSON key")
				}
				keys[name] = true
				if err = value(depth + 1); err != nil {
					return err
				}
			}
			_, err = d.Token()
		case json.Delim('['):
			for d.More() {
				if err = value(depth + 1); err != nil {
					return err
				}
			}
			_, err = d.Token()
		}
		return err
	}
	if err := value(0); err != nil {
		return fmt.Errorf("invalid release JSON: %w", err)
	}
	if _, err := d.Token(); err != io.EOF {
		return fmt.Errorf("release JSON has trailing data")
	}
	return nil
}
