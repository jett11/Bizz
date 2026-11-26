-- Bizloom Phase 2: employee directory fields on business_memberships.
-- Reuses the existing membership/role/status/invite infrastructure from
-- Phase 1 instead of a duplicate employees table — a membership row *is*
-- an employee row once it carries HR-ish fields.

alter table business_memberships add column department text;
alter table business_memberships add column phone text;
alter table business_memberships add column joining_date date not null default current_date;
