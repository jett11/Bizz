-- Bizloom Phase 1: public bucket for business logos.
-- Path convention: {auth.uid()}/{filename} — upload happens during onboarding,
-- before a business row exists, so ownership is keyed to the uploading user.

insert into storage.buckets (id, name, public)
values ('business-logos', 'business-logos', true)
on conflict (id) do nothing;

create policy business_logos_public_read on storage.objects
  for select
  using (bucket_id = 'business-logos');

create policy business_logos_owner_write on storage.objects
  for insert
  with check (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy business_logos_owner_update on storage.objects
  for update
  using (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy business_logos_owner_delete on storage.objects
  for delete
  using (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
