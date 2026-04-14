# Layer 1 Handoff Summary

The Raw Trade Timeline Layer is complete.

It provides:
- full trade timeline
- deterministic state tracking
- execution-level signals
- position-change signals
- timeline relationship signals
- trade-level signals

All outputs are aggregated into:

👉 PatternInput

PatternInput is:
- clean
- flat
- deterministic
- the ONLY allowed input to pattern detection

Next layer must:
- ONLY consume PatternInput
- NOT access raw timeline directly
- NOT re-compute lower level signals

Pattern detection begins from this contract.