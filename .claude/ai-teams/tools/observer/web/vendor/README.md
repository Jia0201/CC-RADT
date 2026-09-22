# Offline browser dependencies

Pinned browser builds, downloaded from the official npm registry with lifecycle scripts disabled. No CDN, runtime package install, or network request is needed. These libraries only format already-authorized, redacted content; they do not read additional files.

| File | Package | License | SHA-256 of included file |
| --- | --- | --- | --- |
| marked.js | marked 18.0.12, lib/marked.umd.js | MIT, see marked.LICENSE | fa0cfbf0181339312eaa3709b577ad698fc21a9baa42d580a3fd1f267b19b4a8 |
| purify.js | dompurify 3.4.15, dist/purify.min.js | Apache-2.0 OR MPL-2.0, see dompurify.LICENSE and dompurify.LICENSE-MPL | f263b05369e050fa175d4ecb9c9358eb4253602d510297adfb31df48b2f1c4d5 |

Upstream: https://github.com/markedjs/marked and https://github.com/cure53/DOMPurify. Build files are unmodified, including their copyright and source-map references; source maps are not served or required.

Rendering policy lives in ../markdown.js: escape embedded HTML, allow-list document elements, disable automatic image loading and non-HTTP(S) links. Code fences stay literal; Mermaid fences are displayed as code, not executed.

For an update, pin and verify the new official package, preserve its license files, update these hashes, and run the Observer browser regression including the Markdown safety tests.
