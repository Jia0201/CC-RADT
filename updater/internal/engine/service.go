package engine

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
)

type Service struct {
	mu     sync.Mutex
	plans  map[string]*Plan
	status Status
	busy   bool
	closed bool
	wg     sync.WaitGroup
}

func NewService() *Service { return &Service{plans: map[string]*Plan{}, status: Status{State: "idle"}} }
func (s *Service) Plan(ctx context.Context, b json.RawMessage) (any, error) {
	s.mu.Lock()
	if s.busy || s.closed {
		s.mu.Unlock()
		return nil, fmt.Errorf("已有操作进行中")
	}
	s.busy = true
	s.wg.Add(1)
	s.mu.Unlock()
	defer func() { s.mu.Lock(); s.busy = false; s.mu.Unlock(); s.wg.Done() }()
	var req PlanRequest
	if e := DecodeJSON(b, &req); e != nil {
		return nil, e
	}
	p, e := NewPlan(ctx, req)
	if e != nil {
		return nil, e
	}
	s.mu.Lock()
	s.plans = map[string]*Plan{p.ID: p}
	s.status = Status{State: "planned", Plan: p}
	s.mu.Unlock()
	return p, nil
}
func (s *Service) Apply(_ context.Context, b json.RawMessage) (any, error) {
	var req ApplyRequest
	if e := DecodeJSON(b, &req); e != nil {
		return nil, e
	}
	s.mu.Lock()
	if s.busy || s.closed {
		s.mu.Unlock()
		return nil, fmt.Errorf("已有操作进行中")
	}
	p := s.plans[req.PlanID]
	if p == nil || !p.Ready {
		s.mu.Unlock()
		return nil, fmt.Errorf("请先完成无冲突预览")
	}
	if !req.AcknowledgeStopped || req.TrustBaseline != p.BaselineDigest || req.TrustTarget != p.TargetDigest {
		s.mu.Unlock()
		return nil, fmt.Errorf("必须确认停止写入和包来源指纹")
	}
	s.busy = true
	s.wg.Add(1)
	s.status = Status{State: "preparing", Total: len(p.Actions), Plan: p}
	s.mu.Unlock()
	go func() {
		defer s.wg.Done()
		r := Runner{Observe: s.setStatus}
		st, e := r.Apply(context.Background(), p, req)
		if e != nil {
			st.Error = e.Error()
			if st.State != "recovery-required" {
				st.State = "failed"
			}
		}
		s.mu.Lock()
		s.status = st
		s.busy = false
		delete(s.plans, p.ID)
		s.mu.Unlock()
	}()
	return s.Status(context.Background(), nil)
}
func (s *Service) Recover(_ context.Context, b json.RawMessage) (any, error) {
	var req struct {
		Transaction        string `json:"transaction"`
		AcknowledgeStopped bool   `json:"acknowledgeStopped"`
	}
	if e := DecodeJSON(b, &req); e != nil {
		return nil, e
	}
	if !req.AcknowledgeStopped {
		return nil, fmt.Errorf("请先停止所有写入者")
	}
	s.mu.Lock()
	if s.busy || s.closed {
		s.mu.Unlock()
		return nil, fmt.Errorf("已有操作进行中")
	}
	s.busy = true
	s.wg.Add(1)
	s.status = Status{State: "recovering", Transaction: req.Transaction}
	s.mu.Unlock()
	go func() {
		defer s.wg.Done()
		st, e := (Runner{Observe: s.setStatus}).Recover(context.Background(), req.Transaction, true)
		if e != nil {
			st.State = "recovery-required"
			st.Transaction = req.Transaction
			st.Error = e.Error()
		}
		s.mu.Lock()
		s.status = st
		s.busy = false
		s.mu.Unlock()
	}()
	return s.Status(context.Background(), nil)
}
func (s *Service) Status(_ context.Context, _ json.RawMessage) (any, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.status, nil
}
func (s *Service) setStatus(st Status) { s.mu.Lock(); s.status = st; s.mu.Unlock() }
func (s *Service) Busy() bool          { s.mu.Lock(); defer s.mu.Unlock(); return s.busy }

// Stop accepting work before waiting, including a request racing server shutdown.
func (s *Service) CloseAndWait() {
	s.mu.Lock()
	s.closed = true
	s.mu.Unlock()
	s.wg.Wait()
}
