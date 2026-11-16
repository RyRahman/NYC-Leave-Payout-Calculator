'use strict';
const $=id=>document.getElementById(id), money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
let last=null;
function clear(){last=null;$('breakdown').hidden=true;$('total').textContent='Ready when you are.';$('status').textContent='Inputs changed. Calculate for an updated estimate.';$('error').textContent='';}
function category(){
 const v=$('profile').value,manager=v==='manager';
 document.querySelectorAll('.manager').forEach(el=>{el.hidden=!manager;});
 $('unionChoice').hidden=v!=='union';
 $('categoryHelp').textContent={manager:'Administrative: NYCPS non-pedagogical managers.',nonmanager:'OJ: NYCPS Original Jurisdiction administrative employees.',union:'Select your administrative union group below. Title-specific agreements may differ.',other:'Other agencies and employee groups need their own verified policy. This preset cannot calculate them.'}[v];
 $('calculate').disabled=v==='other';
}
$('profile').addEventListener('change',category);
category();
$('form').addEventListener('input',clear);
$('form').addEventListener('change',clear);
$('form').addEventListener('submit',e=>{e.preventDefault();clear();try{
 const x={profile:$('profile').value==='union'?$('unionGroup').value:$('profile').value,hiredBefore:$('hire').value==='before'};
 for(const k of ['years','day','rate','vestedRate','annual','vestedAnnual','sick','vestedSick','accrual','ceiling','comp'])x[k]=Number($(k).value);
 const autoCap=$('ceiling').value.trim()==='';
 if($('vestedRate').value.trim()==='')x.vestedRate=x.rate;
 if(autoCap)x.ceiling=x.rate*x.day*260;
 const r=LeaveCalculator.calculate(x);
 if(x.profile==='manager'&&autoCap)r.messages.unshift('Overall cap estimated using hourly rate × hours per day × 260. Enter actual final 12-month compensation under Additional details.');
 r.messages.unshift('Planning assumptions: '+x.day+' hours per day; '+(x.hiredBefore?'hired before July 1, 2004':'hired on or after July 1, 2004')+'.');
 last={x,r};
 $('total').textContent=money(r.total);$('status').textContent='Planning estimate using your entered rates. Before taxes.';
 for(const [id,k] of [['outAnnual','annual'],['outSick','sick'],['outComp','comp'],['subtotal','subtotal'],['reduction','reduction']])$(id).textContent=money(r[k]);
 $('cap').textContent=r.cap===null?'Agreement-specific':money(r.cap);
 $('days').textContent='Included: '+r.annualHours.toFixed(2)+' annual leave hours and '+r.sickDays.toFixed(2)+' paid sick-leave days.';
 $('messages').replaceChildren(...r.messages.map(m=>{const li=document.createElement('li');li.textContent=m;return li;}));$('breakdown').hidden=false;
 }catch(err){$('error').textContent=err.message;}});
$('print').addEventListener('click',()=>window.print());
$('csv').addEventListener('click',()=>{if(!last)return;const {x,r}=last;const rows=[['NYCPS leave payout planning estimate','Value'],['Disclaimer','Rough draft only. Do not rely on this calculator or its results for retirement planning or payout decisions. Contact your retirement office for official guidance and confirmation of your benefits.'],['Profile',x.profile],['Continuous service years',x.years],['Hours per day',x.day],['Current hourly rate',x.rate],['Vested hourly rate',x.vestedRate],['Annual leave payout',r.annual],['Sick leave payout',r.sick],['Comp time payout',r.comp],['Subtotal',r.subtotal],['Overall cap',r.cap??'Agreement-specific'],['Cap reduction',r.reduction],['Gross estimate',r.total],['Assumptions','Entered rates; historical salary and payroll audit may change the amount'],...r.messages.map(m=>['Note',m])];const csv=rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='leave-payout-estimate.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
