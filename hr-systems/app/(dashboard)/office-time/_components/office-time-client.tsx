"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useCurrentUser } from "@/lib/contexts/current-user-context";
import { format, startOfWeek, addDays } from "date-fns";

const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEAD"];
const DOW_HEADERS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const DOW_FULL: Record<number, string> = { 0: "Chủ Nhật", 1: "Thứ Hai", 2: "Thứ Ba", 3: "Thứ Tư", 4: "Thứ Năm", 5: "Thứ Sáu", 6: "Thứ Bảy" };
const DOW_SHORT: Record<number, string> = { 0: "CN", 1: "T2", 2: "T3", 3: "T4", 4: "T5", 5: "T6", 6: "T7" };
const AVCOLORS = ["#3B5BDB","#2196f3","#7c3aed","#0891b2","#059669","#d97706","#dc2626","#be185d","#0f766e","#b45309","#1d4ed8","#6d28d9"];

type AttCode = "X"|"X/2"|"P"|"P/2"|"L"|"L/2"|"CĐ"|"CĐ/2"|"TS"|"TS/2"|"U"|"U/2"|"XP"|"XU"|"PU"|"CĐU"|"--";

interface GridDay {
  date:string;dow:number;isWorkDay:boolean;isWeekend:boolean;isSaturday:boolean;isFuture:boolean;
  code:AttCode;workUnit:number;leaveUnit:number;
  checkIn:string|null;checkOut:string|null;explanation:string|null;
  isManualTime:boolean;leaveType:string|null;leaveShift:string|null;
}
interface AttSummary {
  standardDays:number;actualDays:number;payrollDays:number;paidLeaveDays:number;
  unpaidLeaveDays:number;holidayDays:number;specialLeaveDays:number;maternityDays:number;lateCount:number;
}
interface Period{start:string;end:string;month:number;year:number;}
interface Employee{id:number;fullName:string;department:string|null;avatarUrl?:string|null;}
interface EmployeeInfo{employeeCode:string;fullName:string;department:string;position:string;startDate:string;status:string;}
interface Props {
  initialGrid:GridDay[];initialSummary:AttSummary;initialPeriod:Period;
  initialMonth:number;initialYear:number;employeeId:number;
  employees?:Employee[];viewingName?:string|null;employeeInfo?:EmployeeInfo|null;
  workMode?:string;
}

function pad(n:number){return String(n).padStart(2,"0");}
function fmtTime(d:string|null|undefined){
  if(!d)return"";try{return format(new Date(d),"HH:mm");}catch{return"";}
}
function totalHours(ci:string|null,co:string|null){
  if(!ci||!co)return"0h";
  try{
    const h=(new Date(co).getTime()-new Date(ci).getTime())/3600000;
    if(h<=0)return"0h";
    const hh=Math.floor(h),mm=Math.round((h-hh)*60);
    return mm?`${hh}h ${pad(mm)}m`:`${hh}h`;
  }catch{return"0h";}
}
function fmtNum(n:number){return n%1===0?String(n):n.toFixed(1);}
function codeToMark(code:AttCode):{cls:string;label:string}{
  switch(code){
    case"X":return{cls:"present",label:"X"};
    case"X/2":return{cls:"partial",label:"X/2"};
    case"P":case"P/2":return{cls:"leave",label:code};
    case"L":case"L/2":return{cls:"leave",label:code};
    case"TS":case"TS/2":return{cls:"leave",label:code};
    case"CĐ":case"CĐ/2":return{cls:"partial",label:code};
    case"U":case"U/2":return{cls:"partial",label:code};
    case"XP":case"XU":case"PU":case"CĐU":return{cls:"partial",label:code};
    default:return{cls:"",label:""};
  }
}
const CODE_FULL:Record<string,string>={
  "X":"Đi làm cả ngày","X/2":"Nửa ngày làm",
  "P":"Nghỉ phép","P/2":"Phép nửa ngày","L":"Nghỉ lễ","L/2":"Lễ nửa ngày",
  "CĐ":"Nghỉ chế độ","CĐ/2":"Chế độ nửa ngày","TS":"Thai sản","TS/2":"Thai sản nửa ngày",
  "U":"Không lương cả ngày","U/2":"Không lương nửa ngày",
  "XP":"Làm + Nghỉ phép","XU":"Làm + Không lương","PU":"Phép + Không lương","CĐU":"Chế độ + Không lương","--":"Không có dữ liệu",
};
function initials(name:string){
  const p=name.trim().split(/\s+/);
  if(p.length===1)return p[0].slice(0,2).toUpperCase();
  return(p[p.length-2][0]+p[p.length-1][0]).toUpperCase();
}
function colorIdx(str:string){
  let h=0;for(let i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))&0xffffffff;
  return Math.abs(h)%AVCOLORS.length;
}

const PAGE_CSS = `
.ot-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
@media(max-width:900px){.ot-stats{grid-template-columns:1fr 1fr}}
.ot-stat{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);padding:15px 17px;display:flex;align-items:center;gap:13px}
.ot-stat .osi{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;flex-shrink:0}
.ot-stat .osi svg{width:18px;height:18px}
.ot-stat .osv{font-size:1.5rem;font-weight:800;letter-spacing:-.02em;font-family:var(--font-mono)}
.ot-stat .osl{font-size:.78rem;color:var(--text-3);margin-top:1px}
.ot-stat .osd{font-size:.74rem;font-weight:600;margin-top:2px}
.osd.ok{color:var(--ok)}.osd.warn{color:var(--warn)}.osd.danger{color:var(--danger)}
.clock-card{background:linear-gradient(135deg,var(--accent),#1d4ed8);border-radius:var(--r-lg);padding:22px 24px;color:#fff;position:relative;overflow:hidden;margin-bottom:16px;display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.clock-card::after{content:"";position:absolute;top:-50px;right:-30px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.08);pointer-events:none}
.cc-time{font-family:var(--font-mono);font-size:2.6rem;font-weight:800;letter-spacing:-.02em;line-height:1;position:relative;min-width:160px}
.cc-date{font-size:.86rem;opacity:.85;margin-top:6px}
.cc-status{display:inline-flex;align-items:center;gap:7px;font-size:.82rem;font-weight:600;padding:5px 13px;border-radius:99px;background:rgba(255,255,255,.16);margin-top:10px}
.cc-status .pulse{width:8px;height:8px;border-radius:50%;background:#4ade80;animation:pulse 1.6s ease-in-out infinite}
.cc-status .pulse.grey{background:#94a3b8;animation:none}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.cc-sep{width:1px;height:64px;background:rgba(255,255,255,.2)}
.cc-info{display:flex;gap:28px;position:relative}
.cc-item .ci-l{font-size:.74rem;opacity:.8;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.04em}
.cc-item .ci-v{font-size:1.3rem;font-weight:800;margin-top:3px}
.cc-actions{margin-left:auto;display:flex;gap:10px;position:relative}
.cc-btn{height:46px;padding:0 22px;border-radius:11px;font-family:inherit;font-weight:700;font-size:.92rem;display:inline-flex;align-items:center;gap:9px;cursor:pointer;transition:transform .15s,background .15s;border:none}
.cc-btn svg{width:17px;height:17px}
.cc-btn.checkout,.cc-btn.checkin{background:#fff;color:var(--accent-ink)}
.cc-btn.checkout:hover,.cc-btn.checkin:hover{transform:translateY(-2px)}
.cc-btn.break{background:rgba(255,255,255,.16);color:#fff;border:1px solid rgba(255,255,255,.3)}
.cc-btn.break:hover{background:rgba(255,255,255,.24)}
@media(max-width:700px){.clock-card{flex-direction:column;align-items:flex-start}.cc-actions{margin-left:0;width:100%}.cc-sep{display:none}}
.bc-banner{display:flex;gap:11px;align-items:flex-start;padding:13px 16px;background:rgba(251,191,36,.09);border:1px solid rgba(251,191,36,.28);border-radius:11px;margin-bottom:16px}
.bc-banner .bb-ico{width:22px;height:22px;border-radius:50%;background:rgba(251,191,36,.18);color:#f59e0b;display:grid;place-items:center;flex-shrink:0;margin-top:1px}
.bc-banner .bb-ico svg{width:13px;height:13px}
.bc-banner .bb-txt{font-size:.83rem;color:var(--text-2);line-height:1.55}
.bc-banner .bb-txt b{color:var(--text);font-weight:600}
.bc-layout{display:grid;grid-template-columns:1fr 360px;gap:16px;align-items:start;margin-bottom:16px}
.ot-layout{display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start}
.ot-main{display:flex;flex-direction:column;gap:16px}
.ot-side{display:flex;flex-direction:column;gap:16px}
@media(max-width:1100px){.bc-layout{grid-template-columns:1fr}}
@media(max-width:1050px){.ot-layout{grid-template-columns:1fr}.ot-side{display:grid;grid-template-columns:1fr 1fr}}
.op{background:var(--elev);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden}
.op-head{display:flex;align-items:center;justify-content:space-between;padding:13px 17px;border-bottom:1px solid var(--border);gap:10px;flex-wrap:wrap}
.op-head h3{font-size:.9rem;font-weight:700;display:flex;align-items:center;gap:8px;margin:0}
.op-head h3 svg{width:15px;height:15px;color:var(--accent-ink)}
.week-nav{display:flex;align-items:center;gap:8px}
.week-nav button{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;border:1px solid var(--border);background:var(--content);color:var(--text-2);transition:all .12s;cursor:pointer}
.week-nav button:hover{border-color:var(--accent);color:var(--accent-ink)}
.week-nav button:disabled{opacity:.4;cursor:default}
.week-nav button svg{width:14px;height:14px}
.week-nav .wlabel{font-size:.84rem;font-weight:600;font-family:var(--font-mono);min-width:160px;text-align:center;color:var(--text)}
.bc-emp-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:.92rem}
.bc-emp-head .be-name{font-weight:800;font-size:1.05rem;letter-spacing:-.01em;color:var(--text)}
.bc-emp-head .be-sep{color:var(--border-2)}
.bc-emp-head .be-meta{color:var(--text-3);font-size:.84rem}
.bc-emp-head .be-meta b{color:var(--text-2);font-weight:600}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);border-left:1px solid var(--border);border-top:1px solid var(--border);border-radius:var(--r);overflow:hidden}
.cal-dow{padding:11px 12px;text-align:center;font-size:.8rem;font-weight:600;color:var(--text-2);background:var(--content);border-right:1px solid var(--border);border-bottom:1px solid var(--border)}
.cal-cell{min-height:96px;padding:9px 11px;border-right:1px solid var(--border);border-bottom:1px solid var(--border);position:relative;display:flex;flex-direction:column;transition:background .12s;cursor:default}
.cal-cell:hover:not(.other){background:var(--content)}
.cal-cell.other{background:var(--bg);opacity:.5}
.cal-cell.weekend{background:color-mix(in srgb,var(--accent-soft) 40%,transparent)}
.cal-cell.today{background:var(--accent-soft)}
.cal-cell.today .cd-num{color:var(--accent-ink);font-weight:800}
.cal-cell.has-att{cursor:pointer}
.cal-cell.has-att:hover{box-shadow:inset 0 0 0 2px var(--accent)}
.cd-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:auto}
.cd-num{font-size:.84rem;font-weight:600;color:var(--text-2)}
.cd-flag{width:18px;height:18px;border-radius:50%;display:grid;place-items:center;flex-shrink:0}
.cd-flag svg{width:11px;height:11px}
.cd-body{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:3px;padding:4px 0}
.cd-mark{font-size:1.15rem;font-weight:800;line-height:1}
.cd-mark.present{color:#16a34a}
.cd-mark.partial{color:#3B5BDB}
.cd-mark.late{color:#f97316}
.cd-mark.leave{color:#7c3aed}
.cd-mark.absent{color:var(--danger)}
.cd-time{font-family:var(--font-mono);font-size:.66rem;color:var(--text-3)}
.cd-empty{color:var(--border-2);font-size:1rem;font-weight:700}
.cal-legend{display:flex;gap:14px;flex-wrap:wrap;margin-top:14px;font-size:.78rem;color:var(--text-3)}
.cal-legend .cl-item{display:flex;align-items:center;gap:6px}
.cal-legend .cl-mk{font-weight:800;font-size:.9rem}
@media(max-width:700px){.cal-cell{min-height:64px;padding:5px 6px}.cd-mark{font-size:.95rem}.cd-time{display:none}}
.bc-stat-cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px}
.bc-sc{background:var(--content);border:1px solid var(--border);border-radius:12px;padding:14px 16px}
.bc-sc .sc-l{font-size:.8rem;color:var(--text-3)}
.bc-sc .sc-v{font-size:1.6rem;font-weight:800;color:var(--accent-ink);margin-top:4px;letter-spacing:-.02em;font-family:var(--font-mono)}
.bc-detail-h{font-size:.88rem;font-weight:700;margin-bottom:6px;color:var(--text)}
.bc-detail-row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border);font-size:.86rem}
.bc-detail-row:last-child{border-bottom:none}
.bc-detail-row .dl{color:var(--text-2)}
.bc-detail-row .dv{font-family:var(--font-mono);font-weight:700;color:var(--text)}
.bc-detail-row .dv.muted{color:var(--text-3);font-weight:500}
.bc-detail-row .dv.warn{color:var(--warn)}
.ts-table{width:100%;border-collapse:collapse;font-size:.84rem}
.ts-table th{text-align:left;padding:10px 14px;font-family:var(--font-mono);font-size:.68rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--text-3);border-bottom:1px solid var(--border);background:var(--content);white-space:nowrap}
.ts-table td{padding:11px 14px;border-bottom:1px solid var(--border);color:var(--text-2);vertical-align:middle}
.ts-table tbody tr:last-child td{border-bottom:none}
.ts-table tbody tr:hover{background:var(--content)}
.ts-day{font-weight:600;color:var(--text)}
.ts-day .ts-dow{font-size:.72rem;color:var(--text-3);font-weight:400;margin-left:6px}
.ts-time{font-family:var(--font-mono);font-size:.82rem;color:var(--text)}
.ts-hours{font-family:var(--font-mono);font-weight:700;color:var(--text)}
.ts-badge{display:inline-flex;align-items:center;font-family:var(--font-mono);font-size:.68rem;font-weight:600;padding:2px 8px;border-radius:99px}
.tb-full{background:var(--ok-soft);color:var(--ok)}
.tb-late{background:var(--warn-soft);color:var(--warn)}
.tb-short{background:var(--danger-soft);color:var(--danger)}
.tb-leave{background:var(--accent-soft);color:var(--accent-ink)}
.tb-weekend{background:var(--border);color:var(--text-3)}
.ts-bar{height:6px;border-radius:99px;background:var(--border);overflow:hidden;width:90px;display:inline-block;vertical-align:middle;margin-left:8px}
.ts-bar i{display:block;height:100%;border-radius:99px}
.aq-row{display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--border)}
.aq-row:last-child{border-bottom:none}
.aq-av{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;font-size:.74rem;font-weight:700;color:#fff;flex-shrink:0}
.aq-info{flex:1;min-width:0}
.aq-name{font-weight:600;font-size:.86rem;color:var(--text)}
.aq-detail{font-size:.76rem;color:var(--text-3);margin-top:1px;font-family:var(--font-mono)}
.aq-hours{font-family:var(--font-mono);font-weight:700;font-size:.9rem;color:var(--text);min-width:56px;text-align:right}
.aq-actions{display:flex;gap:6px;flex-shrink:0}
.aq-btn{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;border:1px solid;cursor:pointer;background:transparent}
.aq-btn svg{width:15px;height:15px}
.aq-btn.approve{background:var(--ok-soft);color:var(--ok);border-color:rgba(34,197,94,.25)}
.aq-btn.approve:hover{background:rgba(34,197,94,.2)}
.aq-btn.reject{background:var(--danger-soft);color:var(--danger);border-color:rgba(239,68,68,.25)}
.aq-btn.reject:hover{background:rgba(239,68,68,.2)}
.team-status{display:flex;flex-direction:column;gap:2px}
.tst-row{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;transition:background .12s}
.tst-row:hover{background:var(--content)}
.tst-av{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;font-size:.7rem;font-weight:700;color:#fff;flex-shrink:0;position:relative}
.tst-dot{position:absolute;bottom:-2px;right:-2px;width:11px;height:11px;border-radius:50%;border:2px solid var(--elev)}
.tst-name{font-weight:600;font-size:.84rem;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text)}
.tst-time{font-family:var(--font-mono);font-size:.74rem;color:var(--text-3)}
.tst-state{font-size:.72rem;font-weight:600;padding:2px 8px;border-radius:99px}
.state-in{background:var(--ok-soft);color:var(--ok)}
.state-break{background:var(--warn-soft);color:var(--warn)}
.state-out{background:var(--border);color:var(--text-3)}
.state-leave{background:var(--accent-soft);color:var(--accent-ink)}
.wk-chart{display:flex;align-items:flex-end;gap:8px;height:120px;padding:6px 0}
.wk-bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px}
.wk-bar{width:100%;border-radius:5px 5px 2px 2px;background:var(--accent);min-height:4px;position:relative;cursor:default}
.wk-bar.today-bar{background:linear-gradient(180deg,#60a5fa,var(--accent))}
.wk-bar:hover .wk-tip{opacity:1}
.wk-tip{position:absolute;top:-22px;left:50%;transform:translateX(-50%);font-family:var(--font-mono);font-size:.62rem;color:var(--text-2);opacity:0;transition:opacity .12s;white-space:nowrap;background:var(--elev);border:1px solid var(--border);padding:2px 5px;border-radius:4px}
.wk-lbl{font-family:var(--font-mono);font-size:.66rem;color:var(--text-3)}
.dm-modal{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .2s}
.dm-modal.open{opacity:1;pointer-events:auto}
.dm-scrim{position:absolute;inset:0;background:rgba(0,0,0,.5)}
.dm-card{position:relative;z-index:1;background:var(--elev);border:1px solid var(--border-2);border-radius:var(--r-lg);width:100%;max-width:620px;box-shadow:var(--shadow-lg);overflow:hidden;animation:dmIn .2s ease}
@keyframes dmIn{from{transform:translateY(12px) scale(.98);opacity:0}to{transform:none;opacity:1}}
.dm-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--border)}
.dm-head h3{font-size:1.02rem;font-weight:800;letter-spacing:-.01em;margin:0;color:var(--text)}
.dm-x{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;color:var(--text-3);border:none;background:transparent;cursor:pointer}
.dm-x:hover{background:var(--content);color:var(--text)}
.dm-x svg{width:17px;height:17px}
.dm-body{padding:22px}
.dm-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 24px}
.dm-field .df-l{font-size:.82rem;color:var(--text-3);display:inline}
.dm-field .df-v{font-size:.9rem;color:var(--text);font-weight:600;margin-left:5px}
.dm-sep{height:1px;background:var(--border);margin:18px 0;border:0}
.dm-sep.dashed{border-top:1px dashed var(--border);background:none;height:0}
.dm-times{display:flex;gap:36px;flex-wrap:wrap}
.dm-time-item .dt-l{font-size:.82rem;color:var(--text-3)}
.dm-time-item .dt-v{font-family:var(--font-mono);font-size:1.1rem;font-weight:800;margin-left:6px}
.dm-cong{display:flex;align-items:center;gap:10px}
.dm-cong .dc-mk{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;font-weight:800;font-size:1rem;border:1px solid}
.dm-cong .dc-mk.present{background:rgba(22,163,74,.12);color:#16a34a;border-color:rgba(22,163,74,.3)}
.dm-cong .dc-mk.partial{background:var(--accent-soft);color:var(--accent-ink);border-color:var(--border)}
.dm-cong .dc-mk.leave{background:rgba(124,58,237,.12);color:#7c3aed;border-color:rgba(124,58,237,.3)}
.dm-cong .dc-lbl{font-size:.9rem;font-weight:600;color:var(--text)}
.dm-foot-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 24px}
@media(max-width:560px){.dm-grid,.dm-foot-grid{grid-template-columns:1fr}.dm-times{gap:20px}}
.ot-emp-sel{height:32px;padding:0 10px;border-radius:8px;border:1px solid var(--border);background:var(--content);font-family:inherit;font-size:.84rem;color:var(--text);outline:none;cursor:pointer}
.ot-emp-sel:focus{border-color:var(--accent)}
.spin{animation:_sp .7s linear infinite}@keyframes _sp{to{transform:rotate(360deg)}}
.pend-ct{font-family:var(--font-mono);font-size:.72rem;background:var(--warn-soft);color:var(--warn);border-radius:99px;padding:2px 8px;margin-left:4px}
`;

export function OfficeTimeClient({
  initialGrid,initialSummary,initialPeriod,initialMonth,initialYear,
  employeeId,employees=[],viewingName,employeeInfo,workMode:initialWorkMode="OFFLINE",
}:Props){
  const user=useCurrentUser();
  const isManager=MANAGER_ROLES.includes(user.role.name);

  const [workMode,setWorkMode]=useState(initialWorkMode);
  useEffect(()=>{
    fetch("/api/org/settings").then(r=>r.json()).then(j=>{
      if(j.workMode)setWorkMode(j.workMode);
    }).catch(()=>{});
  },[]);

  const [month,setMonth]=useState(initialMonth);
  const [year,setYear]=useState(initialYear);
  const [empId,setEmpId]=useState(employeeId);
  const [grid,setGrid]=useState(initialGrid);
  const [summary,setSummary]=useState(initialSummary);
  const [period,setPeriod]=useState(initialPeriod);
  const [loading,setLoading]=useState(false);
  const [modal,setModal]=useState<GridDay|null>(null);

  // Empty initial to avoid SSR/client hydration mismatch
  const [clock,setClock]=useState("");
  const [liveDate,setLiveDate]=useState("");
  useEffect(()=>{
    function tick(){
      const d=new Date();
      setClock(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
      setLiveDate(`${DOW_FULL[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`);
    }
    tick();
    const t=setInterval(tick,1000);
    return()=>clearInterval(t);
  },[]);

  const todayStr=format(new Date(),"yyyy-MM-dd");

  // Today may fall outside the currently-viewed payroll period (e.g. viewing June
  // but today is June 29 which is in the July payroll period 26/06-25/07).
  // So we track today's check-in/out with a separate state fetched independently.
  const [todayCheckIn,setTodayCheckIn]=useState<string|null>(null);
  const [todayCheckOut,setTodayCheckOut]=useState<string|null>(null);

  // Determine which payroll month contains today
  function todayPayrollMonth():{month:number;year:number}{
    const d=new Date();
    const day=d.getDate(),m=d.getMonth()+1,y=d.getFullYear();
    if(day>=26){return m===12?{month:1,year:y+1}:{month:m+1,year:y};}
    return{month:m,year:y};
  }

  const fetchToday=useCallback(async(eid:number)=>{
    const {month:tm,year:ty}=todayPayrollMonth();
    try{
      const res=await fetch(`/api/office-time?${new URLSearchParams({month:String(tm),year:String(ty),employeeId:String(eid)})}`);
      const j=await res.json();
      const rec=(j.grid??[]).find((d:GridDay)=>d.date===todayStr);
      setTodayCheckIn(rec?.checkIn??null);
      setTodayCheckOut(rec?.checkOut??null);
      // If the calendar is already showing the correct month, also update grid
      if(tm===month&&ty===year){
        setGrid(j.grid??[]);setSummary(j.summary??initialSummary);setPeriod(j.period??initialPeriod);
      }
    }catch{}
  },[todayStr,month,year]);

  // Fetch today's status on mount and when empId changes
  useEffect(()=>{fetchToday(empId);},[empId]);

  // Also sync todayCheckIn/Out from grid when grid contains today
  const todayFromGrid=useMemo(()=>grid.find(d=>d.date===todayStr)??null,[grid,todayStr]);
  useEffect(()=>{
    if(todayFromGrid){
      setTodayCheckIn(todayFromGrid.checkIn);
      setTodayCheckOut(todayFromGrid.checkOut);
    }
  },[todayFromGrid]);

  const hasCheckin=!!todayCheckIn;
  const hasCheckout=!!todayCheckOut;

  const fetchData=useCallback(async(m:number,y:number,eid:number)=>{
    setLoading(true);setModal(null);
    try{
      const res=await fetch(`/api/office-time?${new URLSearchParams({month:String(m),year:String(y),employeeId:String(eid)})}`);
      const j=await res.json();
      setGrid(j.grid??[]);setSummary(j.summary??initialSummary);setPeriod(j.period??initialPeriod);
    }finally{setLoading(false);}
  },[]);

  function navMonth(delta:number){
    let m=month+delta,y=year;
    if(m<1){m=12;y--;}else if(m>12){m=1;y++;}
    setMonth(m);setYear(y);fetchData(m,y,empId);
  }
  async function doCheckin(){
    await fetch("/api/office-time",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({date:todayStr,checkpoint:"startWork1"})});
    fetchToday(empId);
  }
  async function doCheckout(){
    await fetch("/api/office-time",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({date:todayStr,checkpoint:"endWorkday"})});
    fetchToday(empId);
  }

  const calCells=useMemo(()=>{
    if(!grid.length)return[];
    const leading=(grid[0].dow+6)%7;
    const cells:Array<{type:"empty"|"day";day?:GridDay}>=[];
    for(let i=0;i<leading;i++)cells.push({type:"empty"});
    for(const day of grid)cells.push({type:"day",day});
    const trail=(7-(cells.length%7))%7;
    for(let i=0;i<trail;i++)cells.push({type:"empty"});
    return cells;
  },[grid]);

  // Online mode: navigable week view
  const [weekOffset,setWeekOffset]=useState(0);
  const weekDays=useMemo(()=>{
    const mon=startOfWeek(addDays(new Date(),weekOffset*7),{weekStartsOn:1});
    return Array.from({length:7},(_,i)=>format(addDays(mon,i),"yyyy-MM-dd"));
  },[weekOffset]);
  const weekRows=useMemo(()=>weekDays.map(d=>grid.find(g=>g.date===d)??null),[weekDays,grid]);

  const wkChart=useMemo(()=>weekDays.map(d=>{
    const g=grid.find(x=>x.date===d);
    const h=g?.checkIn&&g?.checkOut?(new Date(g.checkOut).getTime()-new Date(g.checkIn).getTime())/3600000:0;
    const dw=new Date(d).getDay();
    return{d,lbl:DOW_SHORT[dw],h:Math.max(0,h),label:h>0?`${Math.floor(h)}h${h%1?Math.round(h%1*60)+"m":""}`:"-",isToday:d===todayStr};
  }),[weekDays,grid,todayStr]);
  const maxH=Math.max(9,...wkChart.map(w=>w.h));
  const wkTotal=wkChart.reduce((s,w)=>s+w.h,0);
  const wkTotalStr=wkTotal>0?`${Math.floor(wkTotal)}h${wkTotal%1?Math.round(wkTotal%1*60)+"m":""}`:"-";
  const wkLabel=`${format(new Date(weekDays[0]+"T12:00:00"),"dd/MM")} – ${format(new Date(weekDays[6]+"T12:00:00"),"dd/MM/yyyy")}`;

  const statRows=[
    {label:"Công chuẩn",val:summary.standardDays,muted:false,warn:false},
    {label:"Phép",val:summary.paidLeaveDays,muted:summary.paidLeaveDays===0,warn:false},
    {label:"Nghỉ lễ, Tết",val:summary.holidayDays,muted:summary.holidayDays===0,warn:false},
    {label:"Nghỉ chế độ",val:summary.specialLeaveDays,muted:summary.specialLeaveDays===0,warn:false},
    {label:"Nghỉ không lương",val:summary.unpaidLeaveDays,muted:summary.unpaidLeaveDays===0,warn:summary.unpaidLeaveDays>0},
    {label:"Nghỉ thai sản",val:summary.maternityDays,muted:summary.maternityDays===0,warn:false},
    {label:"Phạt muộn/về sớm (h)",val:null,muted:true,warn:false},
    {label:"Truy thu/ bù công",val:null,muted:true,warn:false},
    {label:"Phép tồn đầu tháng",val:null,muted:true,warn:false},
    {label:"Ngày phép còn lại",val:null,muted:true,warn:false},
  ];

  const emp=employeeInfo;
  const modalMark=modal?codeToMark(modal.code):null;
  const modalDate=modal?`${pad(parseInt(modal.date.slice(8)))}/${pad(parseInt(modal.date.slice(5,7)))}/${modal.date.slice(0,4)}`:"";
  const modalDow=modal?DOW_FULL[new Date(modal.date+"T12:00:00").getDay()]:"";
  const todayHours=totalHours(todayCheckIn,todayCheckOut);

  return(
  <>
    {/* dangerouslySetInnerHTML prevents React from diffing style content => no hydration mismatch */}
    <style dangerouslySetInnerHTML={{__html:PAGE_CSS}}/>

    {/* Page head */}
    <div className="page-head" style={{marginBottom:16}}>
      <h1>Office Time</h1>
      <p>Chấm công vào/ra, bảng công tự động từ time log và duyệt giờ làm của team.</p>
    </div>

    {/* Clock card */}
    <div className="clock-card">
      <div>
        <div className="cc-time" suppressHydrationWarning>{clock}</div>
        <div className="cc-date" suppressHydrationWarning>{liveDate}</div>
        <div className="cc-status">
          {hasCheckin&&!hasCheckout
            ?<><span className="pulse"/>{`Đã check-in lúc ${fmtTime(todayCheckIn)}`}</>
            :hasCheckout
              ?<><span className="pulse grey"/>Đã check-out lúc {fmtTime(todayCheckOut)}</>
              :<><span className="pulse grey"/>Chưa check-in hôm nay</>}
        </div>
      </div>
      <div className="cc-sep"/>
      <div className="cc-info">
        <div className="cc-item"><div className="ci-l">Hôm nay</div><div className="ci-v">{todayHours}</div></div>
        <div className="cc-item"><div className="ci-l">Tuần này</div><div className="ci-v">{wkTotalStr}</div></div>
        <div className="cc-item"><div className="ci-l">Mục tiêu</div><div className="ci-v">40h</div></div>
      </div>
      <div className="cc-actions">
        {!hasCheckin&&(
          <button className="cc-btn checkin" onClick={doCheckin}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
            Check-in
          </button>
        )}
        {hasCheckin&&!hasCheckout&&(<>
          <button className="cc-btn break">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v4M10 2v4M14 2v4M4 10h14a2 2 0 0 1 0 8h-1M4 10v6a4 4 0 0 0 4 4h5a4 4 0 0 0 4-4v-6z"/></svg>
            Nghỉ giải lao
          </button>
          <button className="cc-btn checkout" onClick={doCheckout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Check-out
          </button>
        </>)}
        {hasCheckout&&(
          <button className="cc-btn checkout" style={{opacity:.7,cursor:"default"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12l5 5L20 6"/></svg>
            Đã check-out
          </button>
        )}
      </div>
    </div>

    {/* 4 KPI stats */}
    <div className="ot-stats">
      <div className="ot-stat">
        <span className="osi" style={{background:"rgba(34,197,94,.12)",color:"#22c55e"}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5"/></svg>
        </span>
        <div><div className="osv">{fmtNum(summary.actualDays)}</div><div className="osl">Công thực tế (tháng)</div><div className="osd ok">Kỳ lương hiện tại</div></div>
      </div>
      <div className="ot-stat">
        <span className="osi" style={{background:"rgba(59,91,219,.12)",color:"#3B5BDB"}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" strokeLinecap="round"/></svg>
        </span>
        <div><div className="osv">{wkTotalStr}</div><div className="osl">Tổng giờ tuần này</div><div className="osd">/ 40h mục tiêu</div></div>
      </div>
      <div className="ot-stat">
        <span className="osi" style={{background:"rgba(249,115,22,.12)",color:"#f97316"}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" strokeLinecap="round"/></svg>
        </span>
        <div><div className="osv">{fmtNum(summary.payrollDays)}</div><div className="osl">Công tính lương</div><div className="osd">Tháng {pad(month)}/{year}</div></div>
      </div>
      <div className="ot-stat">
        <span className="osi" style={{background:"rgba(217,119,6,.12)",color:"#d97706"}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>
        </span>
        <div><div className="osv">{fmtNum(summary.paidLeaveDays)}</div><div className="osl">Ngày phép đã dùng</div><div className="osd warn">Tháng {pad(month)}/{year}</div></div>
      </div>
    </div>

    {/* Banner */}
    <div className="bc-banner">
      <span className="bb-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 8v4M12 16h.01"/></svg></span>
      <div className="bb-txt"><b>Vui lòng tạo đơn đăng ký trước 12h ngày 26</b> · Quản lý duyệt trước 12h ngày 27.<br/>Mọi thắc mắc liên hệ HC trước 18h ngày 27.</div>
    </div>

    {/* bc-layout: calendar (OFFLINE) or weekly list (ONLINE) */}
    {workMode==="ONLINE"?(
    <div className="op" style={{marginBottom:16}}>
      <div className="op-head">
        <h3>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          Bảng công tuần — {emp?.fullName??viewingName??"Của tôi"}
        </h3>
        <div className="week-nav">
          <button type="button" onClick={()=>{
            const newOffset=weekOffset-1;
            setWeekOffset(newOffset);
            // fetch month that covers the start of that week if needed
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span className="wlabel">{wkLabel}</span>
          <button type="button" onClick={()=>setWeekOffset(weekOffset+1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          {weekOffset!==0&&<button type="button" onClick={()=>setWeekOffset(0)} style={{fontSize:".75rem",padding:"0 10px",width:"auto",minWidth:60}}>Hôm nay</button>}
          {isManager&&employees.length>0&&(
            <select className="ot-emp-sel" value={empId}
              onChange={e=>{const id=Number(e.target.value);setEmpId(id);fetchData(month,year,id);}}>
              {employees.map(e=><option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
          )}
        </div>
      </div>
      <table className="ts-table">
        <thead><tr><th>Ngày</th><th>Check-in</th><th>Check-out</th><th>Tổng giờ</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead>
        <tbody>
          {weekDays.map((wd,i)=>{
            const d=new Date(wd+"T12:00:00");
            const dow=d.getDay();
            const dateLabel=`${DOW_SHORT[dow]} ${pad(d.getDate())}/${pad(d.getMonth()+1)}`;
            const isOff=dow===0||dow===6;
            const isFut=wd>todayStr;
            const isToday=wd===todayStr;
            const row=weekRows[i];
            const ci=row?fmtTime(row.checkIn):"";
            const co=row?fmtTime(row.checkOut):"";
            const hrs=row?totalHours(row.checkIn,row.checkOut):"";
            const code=row?.code??"--";
            let badgeCls="ts-badge",badgeTxt="–";
            if(isOff){badgeCls+=" tb-weekend";badgeTxt="Cuối tuần";}
            else if(isFut){badgeCls+=" tb-weekend";badgeTxt="Chưa đến";}
            else if(code==="X"){badgeCls+=" tb-full";badgeTxt="Đủ công";}
            else if(["X/2","U","U/2"].includes(code)){badgeCls+=" tb-late";badgeTxt="Nửa ngày";}
            else if(["P","P/2","L","L/2","TS","TS/2","CĐ","CĐ/2"].includes(code)){badgeCls+=" tb-leave";badgeTxt="Nghỉ";}
            else if(!isOff&&!isFut&&code==="--"){badgeCls+=" tb-short";badgeTxt="Vắng";}
            return(
              <tr key={wd} style={isToday?{background:"var(--accent-soft)"}:undefined}>
                <td><span className="ts-day">{dateLabel}{isToday&&<span className="ts-dow" style={{color:"var(--accent-ink)",fontWeight:600}}>· Hôm nay</span>}</span></td>
                <td><span className="ts-time">{ci||"–"}</span></td>
                <td><span className="ts-time">{co||"–"}</span></td>
                <td><span className="ts-hours">{hrs||"–"}</span>{hrs&&<span className="ts-bar"><i style={{width:`${Math.min(100,(parseFloat(hrs)||0)/9*100)}%`,background:isOff?"var(--border)":"var(--accent)"}}/></span>}</td>
                <td><span className={badgeCls}>{badgeTxt}</span></td>
                <td><span style={{fontSize:".78rem",color:"var(--text-3)"}}>{row?.explanation??""}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:"1px solid var(--border)"}}>
        <span style={{fontSize:".82rem",color:"var(--text-3)"}}>Tổng tuần này: <strong style={{color:"var(--text)",fontFamily:"var(--font-mono)"}}>{wkTotalStr}</strong> / 40h mục tiêu</span>
        <span style={{fontSize:".78rem",color:"var(--text-3)",fontFamily:"var(--font-mono)"}}>{wkLabel}</span>
      </div>
    </div>
    ):(
    <div className="bc-layout">
      <div className="op">
        <div className="op-head">
          <div className="bc-emp-head">
            {emp&&<>
              <span className="be-name">Bảng công – {emp.fullName}</span>
              <span className="be-sep">|</span>
              <span className="be-meta">Mã NV: <b>{emp.employeeCode}</b></span>
              <span className="be-sep">|</span>
              <span className="be-meta">Phòng ban: <b>{emp.department}</b></span>
            </>}
            {!emp&&viewingName&&<span className="be-name">Bảng công – {viewingName}</span>}
          </div>
          {isManager&&employees.length>0&&(
            <select className="ot-emp-sel" value={empId}
              onChange={e=>{const id=Number(e.target.value);setEmpId(id);fetchData(month,year,id);}}>
              {employees.map(e=><option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
          )}
        </div>
        <div className="op-body" style={{padding:"16px 18px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
            <div className="week-nav">
              <button type="button" onClick={()=>navMonth(-1)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <span className="wlabel">
                Tháng {pad(month)}/{year}
                {loading&&<svg className="spin" style={{marginLeft:6,verticalAlign:"middle"}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="12" height="12"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
              </span>
              <button type="button" onClick={()=>navMonth(1)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
            <span style={{fontFamily:"var(--font-mono)",fontSize:".8rem",color:"var(--text-3)"}}>
              {format(new Date(period.start+"T12:00:00"),"dd/MM/yyyy")} – {format(new Date(period.end+"T12:00:00"),"dd/MM/yyyy")}
            </span>
          </div>
          <div className="cal-grid">
            {DOW_HEADERS.map(h=><div key={h} className="cal-dow">{h}</div>)}
            {calCells.map((cell,idx)=>{
              if(cell.type==="empty")return<div key={`e${idx}`} className="cal-cell other"/>;
              const day=cell.day!;
              const isOff=day.isWeekend||day.isSaturday;
              const isToday=day.date===todayStr;
              const hasAtt=!day.isFuture&&day.code!=="--";
              const mark=codeToMark(day.code);
              const ci=fmtTime(day.checkIn),co=fmtTime(day.checkOut);
              const timeStr=ci?(co?`${ci} – ${co}`:`${ci} –`):"";
              let cls="cal-cell";
              if(isOff)cls+=" weekend"; else if(isToday)cls+=" today";
              if(hasAtt)cls+=" has-att";
              return(
                <div key={day.date} className={cls} onClick={()=>{if(hasAtt)setModal(day);}}>
                  <div className="cd-top">
                    <span className="cd-num">{day.date.slice(8)}</span>
                    {day.isManualTime&&<span className="cd-flag" style={{background:"rgba(251,191,36,.18)",color:"#f59e0b"}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 8v4M12 16h.01"/></svg></span>}
                  </div>
                  <div className="cd-body">
                    {day.isFuture||day.code==="--"
                      ?<span className="cd-empty">– –</span>
                      :<><span className={`cd-mark ${mark.cls}`}>{mark.label}</span>{timeStr&&<span className="cd-time">{timeStr}</span>}</>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="cal-legend">
            <span className="cl-item"><span className="cl-mk" style={{color:"#16a34a"}}>X</span>Đủ công</span>
            <span className="cl-item"><span className="cl-mk" style={{color:"#3B5BDB"}}>U</span>Đang làm / nửa ngày</span>
            <span className="cl-item"><span className="cl-mk" style={{color:"#f97316"}}>M</span>Đi muộn</span>
            <span className="cl-item"><span className="cl-mk" style={{color:"#7c3aed"}}>P</span>Nghỉ phép</span>
            <span className="cl-item"><span className="cl-mk" style={{color:"var(--border-2)"}}>– –</span>Chưa có dữ liệu</span>
          </div>
        </div>
      </div>

      <div className="op">
        <div className="op-head">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/></svg>
            Thống kê T{pad(month)}, {year}
          </h3>
        </div>
        <div className="op-body" style={{padding:18}}>
          <div className="bc-stat-cards">
            <div className="bc-sc"><div className="sc-l">Công thực tế</div><div className="sc-v">{fmtNum(summary.actualDays)}</div></div>
            <div className="bc-sc"><div className="sc-l">Công tính lương</div><div className="sc-v">{fmtNum(summary.payrollDays)}</div></div>
          </div>
          <div className="bc-detail-h">Chi tiết:</div>
          {statRows.map(r=>{
            const display=r.val===null||r.val===0?"– –":fmtNum(r.val);
            const isMuted=display==="– –";
            return(
              <div key={r.label} className="bc-detail-row">
                <span className="dl">{r.label}</span>
                <span className={`dv${isMuted?" muted":r.warn?" warn":""}`}>{display}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    )}

    {/* ot-layout */}
    <div className="ot-layout">
      <div className="ot-main">
        {isManager&&(
          <div className="op">
            <div className="op-head">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>
                Chờ duyệt chấm công
                <span className="pend-ct">0</span>
              </h3>
              <button className="abtn primary" style={{height:30,fontSize:".8rem",display:"flex",alignItems:"center",gap:6}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="13" height="13"><path d="M5 12l5 5L20 6"/></svg>
                Duyệt tất cả
              </button>
            </div>
            <div style={{padding:"28px",textAlign:"center",color:"var(--text-3)",fontSize:".86rem"}}>
              ✓ Đã duyệt hết chấm công tuần này
            </div>
          </div>
        )}
      </div>

      <div className="ot-side">
        {isManager&&employees.length>0&&(
          <div className="op">
            <div className="op-head">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                Trạng thái team
              </h3>
              <span style={{fontFamily:"var(--font-mono)",fontSize:".72rem",color:"var(--text-3)"}}>{employees.length} thành viên</span>
            </div>
            <div className="op-body" style={{padding:10}}>
              <div className="team-status">
                {employees.slice(0,8).map(e=>{
                  const col=AVCOLORS[colorIdx(e.fullName)];
                  const inits=initials(e.fullName);
                  const isMe=e.id===empId;
                  return(
                    <div key={e.id} className="tst-row">
                      <div className="tst-av" style={{background:col}}>
                        {inits}
                        <span className="tst-dot" style={{background:isMe&&hasCheckin?"#22c55e":"#64748b"}}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="tst-name">{e.fullName}</div>
                        <div className="tst-time">{e.department??""}</div>
                      </div>
                      <span className={`tst-state ${isMe&&hasCheckin&&!hasCheckout?"state-in":"state-out"}`}>
                        {isMe&&hasCheckin&&!hasCheckout?"Đang làm":"–"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="op">
          <div className="op-head">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/></svg>
              Giờ làm tuần này
            </h3>
          </div>
          <div className="op-body" style={{padding:"16px 18px"}}>
            <div className="wk-chart">
              {wkChart.map(w=>{
                const hPx=Math.max(4,Math.round(w.h/maxH*108));
                return(
                  <div key={w.d} className="wk-bar-wrap">
                    <div className={`wk-bar${w.isToday?" today-bar":""}`} style={{height:`${hPx}px`}}>
                      <span className="wk-tip">{w.label}</span>
                    </div>
                    <span className="wk-lbl">{w.lbl}</span>
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:10,fontSize:".78rem",color:"var(--text-3)"}}>
              <span>Tổng tuần</span>
              <span style={{fontFamily:"var(--font-mono)",fontWeight:700,color:"var(--text)"}}>{wkTotalStr} / 40h</span>
            </div>
          </div>
        </div>

        <div className="op">
          <div className="op-head">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M4 17h14"/></svg>
              Liên kết nhanh
            </h3>
          </div>
          <div className="op-body" style={{padding:14,display:"flex",flexDirection:"column",gap:8}}>
            <a href="/leave" className="abtn ghost" style={{height:38,fontSize:".83rem",justifyContent:"flex-start",display:"flex",alignItems:"center",gap:8}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              Đăng ký nghỉ phép
            </a>
            <a href="/tasks" className="abtn ghost" style={{height:38,fontSize:".83rem",justifyContent:"flex-start",display:"flex",alignItems:"center",gap:8}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              Time Logs từ Tasks
            </a>
            <a href="/approvals" className="abtn ghost" style={{height:38,fontSize:".83rem",justifyContent:"flex-start",display:"flex",alignItems:"center",gap:8}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>
              Xem phê duyệt
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* Day detail modal */}
    <div className={`dm-modal${modal?" open":""}`}>
      <div className="dm-scrim" onClick={()=>setModal(null)}/>
      {modal&&(
        <div className="dm-card">
          <div className="dm-head">
            <h3>Chi tiết chấm công ngày {modalDate} ({modalDow})</h3>
            <button type="button" className="dm-x" onClick={()=>setModal(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="dm-body">
            <div className="dm-grid">
              <div className="dm-field"><span className="df-l">Mã nhân viên:</span><span className="df-v">{emp?.employeeCode??"– –"}</span></div>
              <div className="dm-field"><span className="df-l">Họ tên:</span><span className="df-v">{emp?.fullName??viewingName??"– –"}</span></div>
              <div className="dm-field"><span className="df-l">Phòng ban:</span><span className="df-v">{emp?.department??"– –"}</span></div>
              <div className="dm-field"><span className="df-l">Vị trí:</span><span className="df-v">{emp?.position??"– –"}</span></div>
              <div className="dm-field"><span className="df-l">Lịch làm việc:</span><span className="df-v">STANDARD_8H</span></div>
              <div/>
              <div className="dm-field"><span className="df-l">Ngày gia nhập:</span><span className="df-v">{emp?.startDate??"– –"}</span></div>
              <div className="dm-field"><span className="df-l">Ngày nghỉ việc:</span><span className="df-v" style={{color:"var(--text-3)"}}>– –</span></div>
            </div>
            <hr className="dm-sep dashed"/>
            <div className="dm-times">
              <div className="dm-time-item">
                <span className="dt-l">Giờ vào đầu tiên:</span>
                <span className="dt-v" style={{color:fmtTime(modal.checkIn)?"#16a34a":"var(--danger)"}}>{fmtTime(modal.checkIn)||"– –"}</span>
              </div>
              <div className="dm-time-item">
                <span className="dt-l">Giờ ra cuối cùng:</span>
                <span className="dt-v" style={{color:fmtTime(modal.checkOut)?"var(--danger)":"var(--text-3)"}}>{fmtTime(modal.checkOut)||"– –"}</span>
              </div>
              <div className="dm-time-item">
                <span className="dt-l">Tổng giờ:</span>
                <span className="dt-v" style={{color:"var(--accent-ink)"}}>{totalHours(modal.checkIn,modal.checkOut)}</span>
              </div>
            </div>
            <hr className="dm-sep dashed"/>
            <div className="dm-cong">
              <span className="dt-l" style={{fontSize:".82rem",color:"var(--text-3)"}}>Công:</span>
              {modalMark&&<span className={`dc-mk ${modalMark.cls}`}>{modalMark.label}</span>}
              <span className="dc-lbl">{CODE_FULL[modal.code]??""}</span>
            </div>
            <hr className="dm-sep dashed"/>
            <div className="dm-foot-grid">
              <div className="dm-field"><span className="df-l">Giải trình:</span><span className="df-v" style={{color:modal.explanation?"var(--text)":"var(--text-3)"}}>{modal.explanation||"– –"}</span></div>
              <div/>
              <div className="dm-field"><span className="df-l">Tổng phút đi muộn/về sớm:</span><span className="df-v">0 phút</span></div>
              <div className="dm-field"><span className="df-l">Giờ phạt:</span><span className="df-v">0h</span></div>
            </div>
            {modal.isManualTime&&(
              <div style={{marginTop:14,padding:"8px 12px",background:"var(--warn-soft)",borderRadius:8,fontSize:".82rem",color:"var(--warn)",fontWeight:600}}>
                ⚠ Giờ chấm công đã được chỉnh sửa thủ công
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </>
  );
}
