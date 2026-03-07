---
name: warn-explanatory-comments
enabled: true
event: file
conditions:
  - field: new_text
    operator: regex_match
    pattern: //\s*(sets|set|gets|get|this|this\s+function|this\s+code|here|we|initialize|initialize\s+|create|create\s+|return\s+|returns?|checks?|validates?|handles?|processes?|formats?|parses?|converts?|transforms?|generates?|builds?|constructs?|loads?|saves?|stores?|retrieves?|fetches?|updates?|deletes?|removes?|adds?|inserts?|appends?|prepends?|merges?|combines?|splits?|joins?|maps?|filters?|reduces?|sorts?|reverses?|finds?|searches?|matches?|replaces?|substitutes?|calculates?|computes?|evaluates?|determines?|decides?|selects?|chooses?|triggers?|invokes?|calls?|executes?|runs?|starts?|stops?|pauses?|resumes?|cancels?|aborts?|completes?|finishes?|ends?|terminates?|closes?|opens?|connects?|disconnects?|binds?|unbinds?|attaches?|detaches?|lists?|displays?|shows?|hides?|renders?|paints?|draws?|writes?|reads?|inputs?|outputs?|prints?|logs?|records?|tracks?|monitors?|watches?|observes?|listens?|responds?|reacts?|handles?|manages?|controls?|regulates?|governs?|directs?|leads?|guides?|instructs?|commands?|orders?|requests?|demands?|requires?|needs?|wants?|expects?|assumes?|supposes?|believes?|thinks?|considers?|regards?|views?|looks?|sees?|watches?|witnesses?|experiences?|undergoes?|suffers?|endures?|bears?|tolerates?|accepts?|rejects?|refuses?|denies?|admits?|confesses?|acknowledges?|recognizes?|identifies?|discovers?|finds?|locates?|detects?|senses?|feels?|perceives?|notices?|observes?|watches?|monitors?|tracks?|records?|documents?|reports?|states?|declares?|announces?|proclaims?|asserts?|claims?|maintains?|argues?|contends?|insists?|demands?|requests?|asks?|pleads?|begs?|prays?|hopes?|wishes?|desires?|wants?|needs?|requires?|needs?|wants?|desires?|craves?|longs?|yearns?|hungers?|thirsts?|hungers?|starves?|fasts?|abstains?|refrains?|holds?|keeps?|maintains?|preserves?|conserves?|protects?|guards?|defends?|shields?|screens?|covers?|hides?|conceals?|masks?|veils?|obscures?|clouds?|blurs?|fogs?|mists?|shrouds?|wraps?|encloses?|surrounds?|encompasses?|embraces?|holds?|contains?|includes?|comprises?|consists?|constitutes?|forms?|makes?|creates?|builds?|constructs?|fabricates?|manufactures?|produces?|generates?|yields?|brings?|delivers?|provides?|supplies?|furnishes?|offers?|presents?|gives?|grants?|bestows?|awards?|contributes?|donates?|lends?|loans?|borrows?|takes?|receives?|accepts?|gets?|acquires?|obtains?|gains?|earns?|wins?|achieves?|accomplishes?|succeeds?|prospers?|thrives?|flourishes?|blooms?|grows?|develops?|expands?|extends?|stretches?|spreads?|scatters?|disperses?|distributes?|shares?|divides?|splits?|separates?|partitions?|segments?|fragments?|breaks?|shatters?|smashes?|crushes?|cracks?|fractures?|damages?|hurts?|injures?|wounds?|harms?|harms?|impairs?|impairs?|weakens?|weakens?|weakens?|destroys?|ruins?|wrecks?|demolishes?|razes?|levels?|flattens?|collapses?|falls?|drops?|plummets?|descends?|sinks?|drops?|plunges?|dives?|leaps?|jumps?|springs?|bounds?|hops?|skips?|dances?|sings?|plays?|performs?|acts?|behaves?|conducts?|operates?|functions?|works?|functions?|runs?|operates?|executes?|performs?|does?|makes?|creates?|builds?|constructs?|forms?|shapes?|molds?|fashions?|designs?|plans?|organizes?|arranges?|orders?|sorts?|classifies?|categorizes?|groups?|clusters?|collects?|gathers?|assembles?|compiles?|composes?|writes?|authors?|drafts?|scripts?|codes?|programs?|develops?|creates?|invents?|discovers?|finds?|uncovers?|reveals?|exposes?|discloses?|publishes?|announces?|declares?|states?|says?|speaks?|talks?|tells?|informs?|notifies?|alerts?|warns?|cautions?|advises?|counsels?|guides?|directs?|leads?|manages?|controls?|governs?|rules?|reigns?|dominates?|masters?|commands?|orders?|commands?|directs?|instructs?|teaches?|educates?|trains?|learns?|studies?|reads?|researches?|investigates?|explores?|examines?|analyzes?|studies?|inspects?|checks?|tests?|verifies?|validates?|confirms?|proves?|demonstrates?|shows?|displays?|exhibits?|presents?|reveals?|unveils?|unwraps?|opens?|closes?|shuts?|locks?|unlocks?|secures?|protects?|defends?|guards?|shields?|covers?|wraps?|packs?|bundles?|ties?|binds?|fastens?|secures?|attaches?|connects?|joins?|links?|chains?|couples?|pairs?|matches?|fits?|suits?|fits?|matches?|corresponds?|equals?|resembles?|looks?|appears?|seems?|sounds?|feels?|tastes?|smells?|senses?|perceives?|understands?|comprehends?|grasps?|apprehends?|knows?|learns?|remembers?|recalls?|remembers?|recalls?|forgets?|remembers?|memorizes?|learns?|studies?|practices?|trains?|exercises?|works?|works?|toils?|labors?|struggles?|fights?|battles?|wars?|combats?|conflicts?|disputes?|argues?|debates?|discusses?|talks?|speaks?|converses?|communicates?|expresses?|articulates?|states?|declares?|announces?|proclaims?|asserts?|claims?|maintains?|contends?|argues?|insists?|demands?|requests?|asks?|seeks?|searches?|looks?|finds?|discovers?|locates?|detects?|identifies?|recognizes?|knows?|understands?|comprehends?|realizes?|sees?|perceives?|notices?|observes?|watches?|witnesses?|experiences?|feels?|senses?|thinks?|believes?|supposes?|assumes?|presumes?|guesses?|estimates?|calculates?|computes?|figures?|determines?|decides?|chooses?|selects?|picks?|opts?|prefers?|likes?|loves?|enjoys?|appreciates?|values?|prizes?|treasures?|cherishes?|adores?|worships?|idolizes?|reveres?|respects?|honors?|admires?|praises?|commends?|applauds?|cheers?|celebrates?|rejoices?|delights?|pleases?|satisfies?|gratifies?|content?|happy?|glad?|joyful?|cheerful?|merry?|jolly?|jovial?|gay?|bright?|sunny?|radiant?|shining?|glowing?|beaming?|smiling?|laughing?|giggling?|chuckling?|grinning?|beaming?|shining?|glowing?|radiating?|emitting?|sending?|transmitting?|broadcasting?|publishing?|announcing?|declaring?|proclaiming?|stating?|saying?|speaking?|talking?|telling?|informing?|notifying?|alerting?|warning?|cautioning?|advising?|counseling?|guiding?|directing?|leading?|managing?|controlling?|governing?|ruling?|reigning?|dominating?|mastering?|commanding?|ordering?|commanding?|directing?|instructing?|teaching?|educating?|training?|learning?|studying?|reading?|researching?|investigating?|exploring?|examining?|analyzing?|studying?|inspecting?|checking?|testing?|verifying?|validating?|confirming?|proving?|demonstrating?|showing?|displaying?|exhibiting?|presenting?|revealing?|unveiling?|unwrapping?|opening?|closing?|shutting?|locking?|unlocking?|securing?|protecting?|defending?|guarding?|shielding?|covering?|wrapping?|packing?|bundling?|tying?|binding?|fastening?|securing?|attaching?|connecting?|joining?|linking?|chaining?|coupling?|pairing?|matching?|fitting?|suiting?|fitting?|matching?|corresponding?|equaling?|resembling?|looking?|appearing?|seeming?|sounding?|feeling?|tasting?|smelling?|sensing?|perceiving?|understanding?|comprehending?|grasping?|apprehending?|knowing?|learning?|remembering?|recalling?|remembering?|recalling?|forgetting?|remembering?|memorizing?|learning?|studying?|practicing?|training?|exercising?|working?|working?|toiling?|laboring?|struggling?|fighting?|battling?|warring?|combating?|conflicting?|disputing?|arguing?|debating?|discussing?|talking?|speaking?|conversing?|communicating?|expressing?|articulating?|stating?|declaring?|announcing?|proclaiming?|asserting?|claiming?|maintaining?|contending?|arguing?|insisting?|demanding?|requesting?|asking?|seeking?|searching?|looking?|finding?|discovering?|locating?|detecting?|identifying?|recognizing?|knowing?|understanding?|comprehending?|realizing?|seeing?|perceiving?|noticing?|observing?|watching?|witnessing?|experiencing?|feeling?|sensing?|thinking?|believing?|supposing?|assuming?|presuming?|guessing?|estimating?|calculating?|computing?|figuring?|determining?|deciding?|choosing?|selecting?|picking?|opting?|preferring?|liking?|loving?|enjoying?|appreciating?|valuing?|prizing?|treasuring?|cherishing?|adoring?|worshipping?|idolizing?|revering?|respecting?|honoring?|admiring?|praising?|commending?|applauding?|cheering?|celebrating?|rejoicing?|delighting?|pleasing?|satisfying?|gratifying?)\s+\w+(\s+to\s+\w+)?\s*\.?$)
---

## ⚠️ Explanatory Comment Detected

You're adding a comment that explains what the code does.

### Why This Matters:
- **Self-documenting code is better**: Use descriptive variable and function names instead
- **Comments rot**: Code changes but comments often don't, causing confusion
- **Redundancy**: The code already tells us what it's doing

### Examples:

❌ **Bad (explanatory):**
```javascript
// Set count to zero
let count = 0;

// Get user data
const userData = fetchUser();

// This function validates the input
function validateInput(input) {
```

✅ **Good (self-documenting):**
```javascript
let initialCount = 0;
const userData = await fetchUserData();

function validateUserInput(input) {
```

### When Comments ARE Acceptable:
- Complex business logic that isn't self-explanatory
- Important warnings or edge cases
- External API requirements or constraints
- Performance considerations or optimizations

### Action Required:
Remove the explanatory comment and use descriptive variable/function names instead.
