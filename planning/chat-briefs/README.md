# Meeseek Box Dedicated Chat Briefs

These markdown files are designed to be dragged into separate chats. Each file is standalone and includes:

- the product context the agent needs
- the decisions already locked
- what that specific chat should focus on
- the output structure the agent should return

Recommended order:

1. `01-core-model.md`
2. `02-agent-interaction-model.md`
3. `03-spec-driven-delivery-model.md`
4. `04-home-page.md`
5. `05-projects-page.md`
6. `06-board-page.md`
7. `07-review-queue-page.md`
8. `08-inbox-page.md`
9. `09-schedules-page.md`
10. `10-detail-pages.md`
11. `11-workspace-bootstrap-and-bind.md`

Important rule:

- The first 3 chats define the cross-cutting system.
- The page chats should reference those system decisions and only define page-specific behavior.
- The page chats should not redefine the core project/workspace/chat/review model unless they find a contradiction.
