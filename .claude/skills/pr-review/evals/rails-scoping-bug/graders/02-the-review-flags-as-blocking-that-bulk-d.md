---
type: llm
focus: trace
weight: 1
---

The review flags as Blocking that bulk_destroy uses an unscoped Place.where(id: params[:ids]), letting a user delete other users' places
