# References and Resources

## Official Anthropic Documentation

### General Limits
- [Does Claude have any message limits?](https://support.anthropic.com/en/articles/8602283-does-claude-have-any-message-limits)
  - Confirms limits exist but doesn't specify exact numbers
  - Mentions "Fair Use" policy approach

### Pro Plan
- [Does the Pro plan have any usage limits?](https://support.anthropic.com/en/articles/8325612-does-the-pro-plan-have-any-usage-limits)
  - States Pro has "significantly higher" limits than Free
  - No specific numbers provided

### Max Plan
- [About Claude's Max plan usage](https://support.anthropic.com/en/articles/11014257-about-claude-s-max-plan-usage)
  - Describes "top 5%" throttling policy
  - No exact thresholds published

### Claude Code Integration
- [Using Claude Code with your Pro or Max plan](https://support.anthropic.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
  - Confirms Claude Code usage counts toward plan limits
  - Integration details for subscriptions

### Support Collection
- [Claude AI Support Collection](https://support.anthropic.com/en/collections/4078531-claude-ai)
  - Main support portal with various articles
  - Check for updates on limit policies

## Community Resources

### ClaudeLog FAQ
- [What is the limit of Claude AI?](https://claudelog.com/faqs/what-is-the-limit-of-claude-ai/)
  - Community-maintained estimates
  - Historical data on observed limits

### Reddit Discussion
- [Updating rate limits for Claude subscription](https://www.reddit.com/r/ClaudeAI/comments/1mbo1sb/updating_rate_limits_for_claude_subscription/)
  - User reports of actual throttling experiences
  - Discussion of the "top 5%" policy impact

### News Coverage
- [TechCrunch: Anthropic unveils new rate limits](https://techcrunch.com/2025/07/28/anthropic-unveils-new-rate-limits-to-curb-claude-code-power-users/)
  - Analysis of rate limit changes
  - Focus on Claude Code power users

- [Hacker News Discussion](https://news.ycombinator.com/item?id=44713757)
  - Technical community discussion
  - User experiences and workarounds

## Key Takeaways from References

1. **No Published Exact Limits**: Anthropic intentionally doesn't publish specific numbers
2. **"Fair Use" Model**: Limits are dynamic and based on overall system usage
3. **Top 5% Policy**: Max users who exceed usage of 95% of users get throttled
4. **Factors Considered**:
   - Message count
   - Token usage (input + output)
   - Concurrent sessions
   - Time-based patterns
   - Overall compute resources

## Community-Observed Estimates (Subject to Change)

Based on user reports across these sources:

### Free Tier
- ~30-50 messages per day
- Limited concurrent sessions (1-2)
- Quick throttling on heavy use

### Pro Tier
- ~300-500 messages per day
- 3-5 concurrent sessions tolerated
- Token limits appear more generous

### Max Tier
- ~1000-2000 messages per day (before hitting "top 5%")
- 5-10 concurrent sessions possible
- Heavy concurrent use triggers throttling faster
- Token-heavy tasks (long contexts) count more

## Important Notes

1. **Limits Change Frequently**: Anthropic adjusts based on capacity and demand
2. **Concurrent Use = Higher Risk**: Multiple simultaneous sessions significantly increase throttling risk
3. **Time Patterns Matter**: Burst usage triggers limits faster than spread usage
4. **No Official API**: These limits apply to web interface and Claude Code only

## How This Tool Helps

Our adaptive learning system:
1. Starts with conservative estimates based on these references
2. Learns your actual limits through throttle detection
3. Adapts as Anthropic changes their policies
4. Provides early warnings to avoid mid-project downgrades

Remember: The best data comes from your own usage patterns. The tool will refine its estimates based on your actual throttle events.