import "server-only";
export type BufferPost = { id: string; status: string; channelId: string };
export class XPreparationError extends Error {}
export class XConfirmedRejection extends Error {}

/** Keep the provider's reason, never credentials or private media addresses. */
export function safeXRejection(message: unknown, secrets: string[] = []) {
  let text = typeof message === 'string' ? message : '';
  for (const secret of secrets.filter(Boolean).sort((a,b)=>b.length-a.length)) text = text.split(secret).join('[redacted]');
  text = text.replace(/https?:\/\/[^\s<>"']+/gi,'[URL removed]')
    .replace(/Bearer\s+\S+/gi,'Bearer [redacted]')
    .replace(/[A-Za-z0-9_-]{32,}/g,'[redacted]')
    .replace(/[\u0000-\u001f\u007f<>]/g,' ').replace(/\s+/g,' ').trim();
  return 'Buffer rejected the X post: ' + (text.slice(0,500) || 'No reason was supplied.');
}

export function xBufferConfig(env = process.env) {
  const key = env.WATCHLIST_BUFFER_API_KEY?.trim(), channel = env.WATCHLIST_BUFFER_X_CHANNEL_ID?.trim();
  return key && channel ? { key, channel } : null;
}

async function graphql(query: string, variables: unknown, key: string, transport: typeof fetch) {
  const response = await transport('https://api.buffer.com', {method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),
    headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({query,variables})});
  if (!response.ok) throw Error('Buffer request could not be confirmed.');
  return response.json();
}

export async function verifyXChannel(channel: string, key: string, transport: typeof fetch = fetch) {
  try {
    const result = await graphql('query WatchlistXChannel($input: ChannelInput!) { channel(input:$input) { id service isDisconnected isLocked } }',{input:{id:channel}},key,transport);
    const found = result.data?.channel;
    if (result.errors?.length || found?.id !== channel || !['twitter','x'].includes(found.service) || found.isDisconnected !== false || found.isLocked !== false) throw Error();
  } catch { throw new XPreparationError('Buffer X connection is unavailable. Watchlist and Discord are unchanged.'); }
}

export async function createXBufferPost(input: {caption:string;channel:string;imageUrls:string[];key:string}, transport: typeof fetch = fetch): Promise<BufferPost> {
  const result = await graphql(`mutation WatchlistXPost($input:CreatePostInput!) {
    createPost(input:$input) { ... on PostActionSuccess { post { id status channelId } } ... on MutationError { message } }
  }`,{input:{text:input.caption,channelId:input.channel,schedulingType:'automatic',mode:'shareNow',
    assets:input.imageUrls.map(url=>({image:{url}}))}},input.key,transport);
  const payload = result.data?.createPost;
  if (payload?.message && !payload.post) throw new XConfirmedRejection(safeXRejection(payload.message,[input.key,input.channel,...input.imageUrls]));
  if (result.errors?.length || !payload?.post?.id || payload.post.channelId !== input.channel) throw Error('Buffer acceptance could not be confirmed.');
  return payload.post;
}

export async function readXBufferPost(id: string, key: string, transport: typeof fetch = fetch): Promise<BufferPost> {
  const result = await graphql('query WatchlistXStatus($input:PostInput!) { post(input:$input) { id status channelId } }',{input:{id}},key,transport);
  if (result.errors?.length || result.data?.post?.id !== id) throw Error('Buffer status unavailable.');
  return result.data.post;
}
