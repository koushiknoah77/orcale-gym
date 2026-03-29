# Pyth Oracle Gym: Scoring & Simulation Mathematics

The scoring engine of Pyth Oracle Gym is designed to evaluate more than just PnL. It measures the "Decision Quality" ($Q$) of a human or AI agent during simulated Pyth market scenarios.

---

## 1. Scenario Variable: The Truth Score ($T$)
The foundation of every scenario is the **Truth Score** ($T$), which measures the reliability of the Pyth Oracle at any given moment using the Price ($P$) and Confidence Interval ($\sigma$):

$$\chi = \frac{\sigma}{P}$$
$$T = 100 \times \max\left(0, 1 - \frac{\chi}{S}\right)$$

*Where $S$ is the sensitivity threshold (e.g., 0.002).*

---

## 2. Decision Score ($D$)
At each checkpoint, the user takes an action ($A$). The **Decision Score** ($D$) is calculated based on how well the action aligns with the subsequent market move ($\Delta P$) and the current Truth Score ($T$).

$$D = (\text{Alignment} \times 0.6) + (\text{Risk Adjustment} \times 0.4)$$

### Alignment Factor
- **Correct Direction ($A$ matches $\Delta P$):** +35 points.
- **Timing Precision:** +25 points (measured by how close the action was to the local optima).

---

## 3. Entropy Shock Resilience ($R$)
When an **Entropy V2** shock hits (a "false breakout" or "liquidity wick"), we measure how the user adapts. 

$$R = 20 - (\text{Panic Decay} \times \text{Reaction Time})$$

- **Panic Decay:** If the user "over-reacts" (e.g., panic selling at the bottom of a fake wick), this score drops.
- **Execution Failures:** If the user attempts a trade during a **Callback Fail** simulated event, they receive a **-10 Execution Penalty**.

---

## 4. Final Gym Score ($G$)
The final score for a gym session is a weighted composite:

$$G = \sum (D_i) + R - \text{Bias Penalty}$$

### Weighted Breakdown:
| Component | Weight | Responsibility |
| :--- | :--- | :--- |
| **Price Alignment** | $35\%$ | Reading the Pyth tape correctly. |
| **Timing** | $25\%$ | Execution precision. |
| **Risk Discipline** | $20\%$ | Respecting Truth Score thresholds and leverage. |
| **Adaptability** | $20\%$ | Handling Entropy shocks and `callbackFailed` events. |

---

## 5. Score Interpretation Profile

| Total Score | Grade | Profile |
| :--- | :--- | :--- |
| **90 - 100** | **S** | **Elite Sentry:** Perfect alignment with Oracle truth and market volatility. |
| **75 - 89** | **A** | **Disciplined Trader:** High performance with minor timing slippage. |
| **50 - 74** | **B** | **Emotional Participant:** Prone to panic during high-entropy wicks. |
| **< 50** | **F** | **Oracle Blind:** Ignored confidence intervals and fell for the entropy fakeout. |
