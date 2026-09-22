package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"os/signal"

	"ccradt/updater/internal/engine"
	"ccradt/updater/internal/release"
	"ccradt/updater/internal/web"
)

func emit(v any) { e := json.NewEncoder(os.Stdout); e.SetIndent("", "  "); _ = e.Encode(v) }
func main() {
	if e := run(os.Args[1:]); e != nil {
		fmt.Fprintln(os.Stderr, "升级器：", e)
		os.Exit(1)
	}
}
func run(args []string) error {
	if len(args) == 0 {
		args = []string{"ui"}
	}
	if args[0] == "version" {
		fmt.Println(engine.Version)
		return nil
	}
	if args[0] == "releases" || args[0] == "download" {
		f := flag.NewFlagSet(args[0], flag.ContinueOnError)
		var req release.Request
		f.StringVar(&req.Version, "version", "", "明确的 GitHub Release 标签 vX.Y.Z")
		f.StringVar(&req.Asset, "asset", "", "Release 中的准确 ZIP 附件名")
		f.StringVar(&req.Output, "output", "", "项目外不存在的新下载目录")
		if e := f.Parse(args[1:]); e != nil {
			return e
		}
		if f.NArg() != 0 {
			return fmt.Errorf("存在未识别参数")
		}
		if args[0] == "releases" {
			v, e := release.List(context.Background(), req.Version)
			if e == nil {
				emit(v)
			}
			return e
		}
		v, e := release.Download(context.Background(), req)
		if e == nil || v.Directory != "" {
			emit(v)
		}
		return e
	}
	if args[0] == "verify-signature" {
		f := flag.NewFlagSet("verify-signature", flag.ContinueOnError)
		manifest := f.String("manifest", "", "清单路径")
		signature := f.String("signature", "", "独立签名路径")
		publicKey := f.String("public-key", "", "通过独立可信渠道获得的 Base64 Ed25519 公钥")
		if e := f.Parse(args[1:]); e != nil {
			return e
		}
		if f.NArg() != 0 {
			return fmt.Errorf("存在未识别参数")
		}
		if e := engine.VerifyManifestSignature(*manifest, *signature, *publicKey); e != nil {
			return e
		}
		emit(map[string]any{"verified": true, "algorithm": "Ed25519"})
		return nil
	}
	if args[0] == "help" || args[0] == "--help" {
		fmt.Print(`CC-RADT 独立升级器

  cc-radt-updater ui
  cc-radt-updater plan --project PATH --baseline OLD_PACKAGE --package NEW_PACKAGE
  cc-radt-updater apply --project PATH --baseline OLD_PACKAGE --package NEW_PACKAGE
    --stopped --trust-baseline SHA256 --trust-target SHA256
  cc-radt-updater status --transaction PATH
  cc-radt-updater recover --transaction PATH --stopped
  cc-radt-updater releases --version v1.1.0
  cc-radt-updater download --version v1.1.0 --asset ATTACHMENT.zip --output NEW_DIRECTORY
  cc-radt-updater verify-signature --manifest PATH --signature PATH --public-key BASE64

--baseline-manifest / --package-manifest 可指定外部兼容清单。
先 plan 核对内容和来源；apply 必须明确给出两份清单指纹。
安装只操作已核验本地包，不运行旧 Harness 脚本；下载不自动安装。
`)
		return nil
	}
	ctx := context.Background()
	if args[0] == "ui" {
		svc := engine.NewService()
		defer svc.CloseAndWait()
		serverCtx, cancel := context.WithCancel(ctx)
		defer cancel()
		sig := make(chan os.Signal, 1)
		signal.Notify(sig, os.Interrupt)
		defer signal.Stop(sig)
		go func() {
			for {
				select {
				case <-sig:
					if svc.Busy() {
						fmt.Fprintln(os.Stderr, "操作进行中；请等待完成后退出。强制退出后须先执行 recover。")
						continue
					}
					cancel()
					return
				case <-serverCtx.Done():
					return
				}
			}
		}()
		return web.Serve(serverCtx, "127.0.0.1:0", web.Backend{Plan: svc.Plan, Apply: svc.Apply, Recover: svc.Recover, Status: svc.Status}, func(url string) { fmt.Println("CC-RADT 独立升级器，请在本机浏览器打开：\n" + url) })
	}
	flags := flag.NewFlagSet(args[0], flag.ContinueOnError)
	var req engine.PlanRequest
	var trustOld, trustNew, tx string
	var stopped bool
	flags.StringVar(&req.Project, "project", "", "目标项目目录")
	flags.StringVar(&req.Baseline, "baseline", "", "旧版原始安装包")
	flags.StringVar(&req.Package, "package", "", "新版安装包")
	flags.StringVar(&req.BaselineManifest, "baseline-manifest", "", "旧包外部兼容清单")
	flags.StringVar(&req.PackageManifest, "package-manifest", "", "新包外部兼容清单")
	flags.StringVar(&trustOld, "trust-baseline", "", "明确认可旧清单指纹")
	flags.StringVar(&trustNew, "trust-target", "", "明确认可新清单指纹")
	flags.StringVar(&tx, "transaction", "", "恢复事务绝对路径")
	flags.BoolVar(&stopped, "stopped", false, "已停止项目所有写入者")
	if e := flags.Parse(args[1:]); e != nil {
		return e
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("存在未识别参数")
	}
	switch args[0] {
	case "plan", "apply":
		p, e := engine.NewPlan(ctx, req)
		if e != nil {
			return e
		}
		if args[0] == "plan" {
			emit(p)
			return nil
		}
		runner := engine.Runner{Observe: func(s engine.Status) { fmt.Fprintf(os.Stderr, "%s %d/%d\n", s.State, s.Step, s.Total) }}
		s, e := runner.Apply(ctx, p, engine.ApplyRequest{PlanID: p.ID, AcknowledgeStopped: stopped, TrustBaseline: trustOld, TrustTarget: trustNew})
		if e != nil {
			s.Error = e.Error()
			if s.State != "recovery-required" {
				s.State = "failed"
			}
		}
		emit(s)
		return e
	case "recover":
		s, e := (engine.Runner{}).Recover(ctx, tx, stopped)
		if e != nil {
			s.Error = e.Error()
		}
		emit(s)
		return e
	case "status":
		s, e := engine.TransactionStatus(tx)
		if e != nil {
			return e
		}
		emit(s)
		return nil
	default:
		return fmt.Errorf("未知命令 %s，使用 --help", args[0])
	}
}
