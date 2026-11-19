import {partitionDiscordAlertText} from "./discord-alert-message-parts";

/** The source community and its composer use the same Discord text layout. */
export function sourceAlertDiscordParts(input:Readonly<{title:string;symbol?:string|null;body:string}>):readonly string[]{
  const lead=`${input.symbol?`${input.symbol} - `:""}${input.title}`;
  return partitionDiscordAlertText({
    single:`**${lead}**\n${input.body}`,
    body:input.body,
    header:(part,total)=>`**${lead} (${part}/${total})**\n`,
    footer:"",
  });
}
