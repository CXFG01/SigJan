# SignalRx demonstration

Use synthetic prescriptions only. Before presenting, configure the server keys, apply the checker migration in the demo environment, verify the maintenance trigger, and reserve enough daily investigation quota. Do not promise a sub-minute investigation: the current window is 90 seconds per pair.

1. Open the homepage without signing in. Explain: “Paste a prescription, confirm the medicines, and see what the evidence says.”
2. Choose **Try an example** and **Review medicines**. Show original wording beside editable names, dose and timing. Missing details remain blank; ambiguous identities must be clarified.
3. Confirm the synthetic list and choose **Check interactions**. Show database findings and expand **Source coverage** to identify the DDInter release.
4. Explain that conflicting, incomplete or uncovered pairs are selected automatically for investigation. Existing findings remain visible while the hosted Agents API session reads authoritative sources.
5. Show either a validated sourced report or the honest unresolved/timeout result. Research does not overwrite the original database findings or declare a combination safe.
6. Demonstrate **Cancel research** if a session is running. Conclude by showing **How we handle evidence**, including temporary data and provider retention.

For a known synthetic investigation verification, the included script uses Apixaban and Ibuprofen with an intentionally empty baseline. That fixture demonstrates the research path; it must never be presented as evidence that the real database lacks this pair.
