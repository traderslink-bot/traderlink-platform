import type {CommunityStatsReport,CommunityStatsTableRow} from "../../contracts/community-stats-contracts";

export type StatsWorkbookSheet=Readonly<{title:string;columns:readonly string[];rows:Iterable<Readonly<Record<string,unknown>>>}>;
const xml=(value:unknown)=>String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/gu,"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;");
const bytes=(text:string)=>Buffer.from(text,"utf8");
const crcTable=Uint32Array.from({length:256},(_,index)=>{let value=index;for(let bit=0;bit<8;bit++)value=value&1?0xedb88320^(value>>>1):value>>>1;return value>>>0;});
const namespace="http://schemas.openxmlformats.org/spreadsheetml/2006/main";
function columnName(index:number):string{let name="";for(index++;index;index=Math.floor((index-1)/26))name=String.fromCharCode(65+(index-1)%26)+name;return name;}
function cell(value:unknown,address:string,header=false):string{
  const style=header?' s="1"':"";
  if(value===null||value===undefined)return `<c r="${address}"${style}/>`;
  if(typeof value==="number"&&Number.isFinite(value))return `<c r="${address}"${style}><v>${value}</v></c>`;
  const text=String(value);if(text.length>32767)throw new RangeError("A Stats cell exceeds Excel's text limit.");
  // Inline strings never become formulas, external links or numeric Discord IDs.
  return `<c r="${address}" t="inlineStr"${style}><is><t xml:space="preserve">${xml(text)}</t></is></c>`;
}

/** ZIP32 stored entries with data descriptors: no dependencies or workbook-sized buffers. */
export function* streamStatsWorkbook(input:Iterable<StatsWorkbookSheet>):Generator<Uint8Array>{
  const names:string[]=[],used=new Set<string>(),central:Buffer[]=[];let offset=0;
  const nameFor=(title:string)=>{
    const base=(title.replace(/[\\/*?:\[\]\u0000-\u001F]/gu," ").replace(/^'+|'+$/gu,"").trim()||"Stats").slice(0,31).replace(/^'+|'+$/gu,"")||"Stats";
    let name=base,index=2;while(used.has(name.toLowerCase())){const suffix=` (${index++})`;name=base.slice(0,31-suffix.length)+suffix;}
    used.add(name.toLowerCase());return name;
  };
  function* archiveEntries():Generator<{name:string;chunks:Iterable<Uint8Array>}>{
    for(const sheet of input){
      if(!sheet.columns.length)continue;
      if(sheet.columns.length>16384)throw new RangeError("Too many Excel columns.");
      const iterator=sheet.rows[Symbol.iterator]();let next=iterator.next(),part=1;
      try{
        do{
          names.push(nameFor(part===1?sheet.title:`${sheet.title} ${part}`));const sheetIndex=names.length;
          function* worksheet():Generator<Uint8Array>{
            yield bytes(`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="${namespace}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${sheet.columns.map((name,index)=>`<col min="${index+1}" max="${index+1}" width="${Math.max(18,Math.min(44,name.length+6))}" customWidth="1"/>`).join("")}</cols><sheetData><row r="1">${sheet.columns.map((name,index)=>cell(name,`${columnName(index)}1`,true)).join("")}</row>`);
            let row=2,chunk="";
            while(!next.done&&row<=1048576){
              chunk+=`<row r="${row}">${sheet.columns.map((column,index)=>cell(next.value[column],`${columnName(index)}${row}`)).join("")}</row>`;
              next=iterator.next();row++;
              if(row%64===0){yield bytes(chunk);chunk="";}
            }
            yield bytes(chunk+`</sheetData><autoFilter ref="A1:${columnName(sheet.columns.length-1)}${row-1}"/></worksheet>`);
          }
          yield {name:`xl/worksheets/sheet${sheetIndex}.xml`,chunks:worksheet()};part++;
        }while(!next.done);
      }finally{iterator.return?.();}
    }
    if(!names.length)throw new RangeError("No Stats sheets are available.");
    const entry=(name:string,text:string)=>({name,chunks:[bytes('<?xml version="1.0" encoding="UTF-8"?>'+text)]});
    yield entry("[Content_Types].xml",`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${names.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`);
    yield entry("_rels/.rels",'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    yield entry("xl/workbook.xml",`<workbook xmlns="${namespace}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((name,i)=>`<sheet name="${xml(name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join("")}</sheets></workbook>`);
    yield entry("xl/_rels/workbook.xml.rels",`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${names.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join("")}<Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
    yield entry("xl/styles.xml",`<styleSheet xmlns="${namespace}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF011E56"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf xfId="0"/><xf fontId="1" fillId="2" applyFont="1" applyFill="1" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`);
  }
  for(const entry of archiveEntries()){
    const name=bytes(entry.name),start=offset,header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x808,6);header.writeUInt16LE(0x21,12);header.writeUInt16LE(name.length,26);
    yield header;yield name;offset+=header.length+name.length;let crc=0xffffffff,size=0;
    for(const chunk of entry.chunks){for(const byte of chunk)crc=crcTable[(crc^byte)&255]^(crc>>>8);size+=chunk.length;offset+=chunk.length;if(size>0xffffffff||offset>0xffffffff)throw new RangeError("Stats workbook exceeds ZIP32 size.");yield chunk;}
    crc=(crc^0xffffffff)>>>0;const descriptor=Buffer.alloc(16);descriptor.writeUInt32LE(0x08074b50);descriptor.writeUInt32LE(crc,4);descriptor.writeUInt32LE(size,8);descriptor.writeUInt32LE(size,12);yield descriptor;offset+=16;
    const record=Buffer.alloc(46);record.writeUInt32LE(0x02014b50);record.writeUInt16LE(20,4);record.writeUInt16LE(20,6);record.writeUInt16LE(0x808,8);record.writeUInt16LE(0x21,14);record.writeUInt32LE(crc,16);record.writeUInt32LE(size,20);record.writeUInt32LE(size,24);record.writeUInt16LE(name.length,28);record.writeUInt32LE(start,42);central.push(Buffer.concat([record,name]));
  }
  if(central.length>65535)throw new RangeError("Too many Excel sheets.");
  const start=offset;for(const record of central){yield record;offset+=record.length;}
  const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(central.length,8);end.writeUInt16LE(central.length,10);end.writeUInt32LE(offset-start,12);end.writeUInt32LE(start,16);yield end;
}

export function* communityStatsWorkbookSheets(report:CommunityStatsReport,readPage:(page:number)=>CommunityStatsReport,eventRows?:(timeline:boolean)=>Readonly<{columns:readonly string[];rows:Iterable<CommunityStatsTableRow>}>,filters:Readonly<Record<string,string>>={}):Generator<StatsWorkbookSheet>{
  const sheet=(title:string,columns:readonly string[],rows:StatsWorkbookSheet["rows"])=>({title,columns,rows});
  yield sheet("Report details",["Field","Value"],[{Field:"Community",Value:report.communityName},{Field:"Report",Value:report.tab},{Field:"Scope",Value:report.scope},{Field:"From UTC",Value:report.window.fromDate},{Field:"Through UTC",Value:report.window.throughDate},{Field:"Generated UTC",Value:report.window.asOfUtc},{Field:"Quiet days",Value:report.window.quietDays},{Field:"Gap calendar",Value:report.window.calendar},...Object.entries(filters).map(([key,value])=>({Field:key,Value:value}))]);
  for(const metric of report.metrics)yield sheet(metric.label,["Measure","Current","Prior period"],[{Measure:metric.label,Current:metric.value,"Prior period":metric.previous}]);
  if(report.columns.length){
    const title=report.tab==="team"?"Roles and permissions":report.tab==="cohorts"?"Exact-day return cohorts":report.tab[0].toUpperCase()+report.tab.slice(1);
    if(report.tab==="visits"&&eventRows){const events=eventRows(false);yield sheet(title,events.columns,events.rows);}
    else yield sheet(title,report.columns,(function*(){const count=report.tab==="timing"?1:Math.max(1,Math.ceil(report.totalRows/report.pageSize));for(let page=1;page<=count;page++){const slice=page===report.page?report:readPage(page);yield* slice.rows;}})());
  }
  for(const section of report.sections)yield sheet(section.title,section.columns,(function*(){const count=section.totalRows===undefined?1:Math.max(1,Math.ceil(section.totalRows/report.pageSize));for(let page=1;page<=count;page++){const slice=page===report.page?report:readPage(page);yield* slice.sections.find(item=>item.title===section.title)?.rows??[];}})());
  if(report.tab==="overview"||report.tab==="pages"&&report.trend.length)yield sheet("Activity over time",report.trend.every(p=>p.discord===null)?["UTC date","Webpage visits"]:["UTC date","Webpage visits","Discord contributions"],report.trend.map(p=>({"UTC date":p.date,"Webpage visits":p.web,"Discord contributions":p.discord})));
  if(["overview","participation"].includes(report.tab)&&report.scope!=="own_content")yield sheet("Participation summary",["Participation","Members"],Object.entries(report.segments).map(([key,value])=>({Participation:key,Members:value})));
  if(report.tab==="timing")for(const label of ["Webpage visits","Discord contributions"].filter(key=>report.columns.includes(key)))yield sheet(`${label} by time`,["Weekday UTC","Hour UTC",label],report.rows);
  if(report.tab==="cohorts"&&report.activation)yield sheet("Activation",["Measure","Value"],Object.entries(report.activation).filter(([key])=>key!=="attribution").map(([key,value])=>({Measure:key.replace(/([a-z])([A-Z])/gu,"$1 $2"),Value:value})));
  if(report.member){
    for(const surface of [report.member.participation.discord,report.member.participation.web]){
      const title=surface.surface==="discord"?"Member Discord activity":"Member webpage activity";
      yield sheet(title,["Measure","Value"],[{Measure:"Last observed UTC",Value:surface.lastObservedAtUtc},{Measure:"Current gap days",Value:surface.currentGapDays},{Measure:"Current gap state",Value:surface.currentGapState},{Measure:"Measured through UTC",Value:surface.measuredThroughUtc},{Measure:"Median closed gap days",Value:surface.medianClosedGapDays},{Measure:"Longest closed gap days",Value:surface.longestClosedGapDays},{Measure:"Longest observed streak",Value:surface.longestCompleteDateStreak},{Measure:"Observed active dates",Value:surface.activeCompleteDates},{Measure:"Observed complete dates",Value:surface.observedCompleteDates},{Measure:"Returns after quiet period",Value:surface.returnDatesInReport.length}]);
      yield sheet(`${surface.surface} activity dates`,["UTC date","State","Events"],surface.days.map(day=>({"UTC date":day.date,State:day.state,Events:day.eventCount})));
    }
    yield sheet("Member measures",["Measure","Current","Prior","Change"],report.member.measures);if(eventRows){const events=eventRows(true);yield sheet("Member timeline",events.columns,events.rows);}}
  const selected=report.tab==="pages"?report.catalog.find(item=>item.id===filters["Page filter"]):null;
  if(selected)yield sheet(selected.title,["Page","Author","State","Publication format"],[{Page:selected.title,Author:selected.authorName??"Community",State:selected.state,"Publication format":selected.publicationMode??"unknown"}]);
  if(report.sources.length)yield sheet("Collection coverage",["source","status","Retained data since UTC","Checked UTC","Last event UTC","reason"],report.sources);
  if(report.notes.length)yield sheet("Definitions",["Definition"],report.notes.map(note=>({Definition:note})));
}
