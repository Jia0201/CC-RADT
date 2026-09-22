package engine

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"path/filepath"
	"testing"
)

func TestDetachedSignature(t *testing.T) {
	root := t.TempDir()
	public, private, e := ed25519.GenerateKey(rand.Reader)
	if e != nil {
		t.Fatal(e)
	}
	b := []byte(`{"version":"1.1.0"}`)
	put(t, root, "manifest.json", string(b))
	sig, _ := json.Marshal(map[string]string{"algorithm": "Ed25519", "signature": base64.StdEncoding.EncodeToString(ed25519.Sign(private, b))})
	put(t, root, "signature.json", string(sig))
	key := base64.StdEncoding.EncodeToString(public)
	if e = VerifyManifestSignature(filepath.Join(root, "manifest.json"), filepath.Join(root, "signature.json"), key); e != nil {
		t.Fatal(e)
	}
	put(t, root, "manifest.json", "tampered")
	if e = VerifyManifestSignature(filepath.Join(root, "manifest.json"), filepath.Join(root, "signature.json"), key); e == nil {
		t.Fatal("accepted invalid signature")
	}
}
