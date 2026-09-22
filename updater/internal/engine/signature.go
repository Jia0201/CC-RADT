package engine

import (
	"crypto/ed25519"
	"encoding/base64"
	"fmt"
)

// VerifyManifestSignature validates a detached signature using a public key
// supplied through an independently trusted channel, never a key from the package.
func VerifyManifestSignature(manifestPath, signaturePath, publicKey string) error {
	b, e := readPlainBounded(manifestPath, 8<<20)
	if e != nil {
		return e
	}
	if len(b) > 8<<20 {
		return fmt.Errorf("清单过大")
	}
	sb, e := readPlainBounded(signaturePath, 4096)
	if e != nil {
		return e
	}
	if len(sb) > 4096 {
		return fmt.Errorf("签名文件过大")
	}
	var sig struct {
		Algorithm string `json:"algorithm"`
		Signature string `json:"signature"`
	}
	if e = DecodeStrictJSON(sb, &sig); e != nil {
		return e
	}
	if sig.Algorithm != "Ed25519" {
		return fmt.Errorf("不支持的签名算法")
	}
	key, e := base64.StdEncoding.DecodeString(publicKey)
	if e != nil || len(key) != ed25519.PublicKeySize {
		return fmt.Errorf("发布公钥无效")
	}
	bytes, e := base64.StdEncoding.DecodeString(sig.Signature)
	if e != nil || !ed25519.Verify(ed25519.PublicKey(key), b, bytes) {
		return fmt.Errorf("签名验证失败")
	}
	return nil
}
