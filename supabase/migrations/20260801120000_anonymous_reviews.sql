-- Allow anyone (including anonymous visitors) to submit a review.
-- Reviews still land as 'pending' and are moderated before going live,
-- so this does not expose approved content to spam without review.

-- 1) Anonymous visitors may insert a pending, non-admin review with no user_id.
drop policy if exists "Anonymous can submit pending reviews" on public.reviews;
create policy "Anonymous can submit pending reviews"
  on public.reviews
  for insert
  to anon
  with check (
    user_id is null
    and status = 'pending'
    and is_admin_added = false
  );

-- 2) Anonymous visitors may upload review photos, scoped to the 'anon/' folder
--    of the (public-read) review-images bucket to limit the write surface.
drop policy if exists "Anonymous can upload review images" on storage.objects;
create policy "Anonymous can upload review images"
  on storage.objects
  for insert
  to anon
  with check (
    bucket_id = 'review-images'
    and (storage.foldername(name))[1] = 'anon'
  );
