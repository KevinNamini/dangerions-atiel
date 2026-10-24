# Places 4–8: design decision

Restore the pre-collection hero (commit 29a3615), preserving the approved animation layer. Remove the later seal, shared lighting and metal-frame polish from the page. Do not replace character artwork or data.

## Options evaluated before implementation

| Rank | Direction | Score | Tradeoff |
|---|---|---|---|
| 1 | Horizontal character cards | 9/10 | Strong individual portraits and readable comparisons; complements the podium without repeating it |
| 2 | Illustrated guild-book rows | 8/10 | Elegant but too little distinction from the existing list |
| 3 | Cinematic image banners | 7/10 | Expressive but mobile crops and text compete with faces |
| 4 | Staggered gallery | 6/10 | More rhythm, worse numeric alignment and mobile scanning |
| 5 | Two-column collectible cards | 5/10 | Too narrow on phones and competes with the top three |

## Chosen direction

Five horizontal character cards. A fixed rank column remains centered. A larger portrait leads into name and class; item level and growth stack at the right. Use restrained class-colored reflected light, dark emerald surfaces and small edge details. No new descriptive copy, medals, invented stats or duplicated heroes.

The treatment follows sorted positions 4–8, not hardcoded player identities. Slots 9+ remain compact. Keep the roster sorted and accessible. Use existing portraits and retain keyboard profile activation. Existing reduced-motion rules apply.

## Review criteria

Check 320px and 390px widths plus desktop: no name/value overlap, no horizontal overflow, clearly readable scores, centered ranks and intact faces. Confirm podium and header match the previous design. Run existing all-player podium regression checks. Publish to the existing Render service after visual review.
