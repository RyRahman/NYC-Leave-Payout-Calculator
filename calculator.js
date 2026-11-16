(function(root){
'use strict';
function calculate(x){
 for(const k of ['years','day','rate','vestedRate','annual','vestedAnnual','sick','vestedSick','accrual','ceiling','comp']) if(!Number.isFinite(x[k])||x[k]<0) throw new Error('Enter a valid, nonnegative value for '+k+'.');
 if(x.day<=0||x.rate<=0||x.vestedRate<=0) throw new Error('Hours per day and pay rates must be greater than zero.');
 if(x.profile==='other') throw new Error('No verified citywide preset. Select an NYCPS administrative profile.');
 const manager=x.profile==='manager', old=x.hiredBefore, messages=[];
 let annualHours=x.annual, vestedHours=x.vestedAnnual, sickDays=0, vestedDays=0;
 if(manager){
  const multiple=x.years<=5?3:x.years<=10?4:5;
  const limit=multiple*x.accrual*x.day;
  annualHours=Math.min(x.annual,limit);
  if(x.annual>limit) messages.push('Current annual leave exceeds the service-based limit. Excess excluded.');
  if(x.years>10&&x.sick/x.day>=60) sickDays=x.sick/x.day/3;
  else if(x.sick>0) messages.push('Current sick leave requires more than 10 years of service and at least 60 days.');
  if(x.years>=10) vestedDays=old?Math.min(x.vestedSick/x.day,200)/2:x.vestedSick/x.day/3;
  else if(x.vestedSick>0) messages.push('Vested sick leave requires at least 10 years of service.');
  // Combined cap allocation is an explicit estimate, pending payroll audit.
  vestedDays=Math.min(vestedDays,120); sickDays=Math.min(sickDays,120-vestedDays);
  if((x.vestedSick>0&&x.sick>0)) messages.push('Combined sick cap allocated to vested leave first for this estimate. Confirm allocation and rates with payroll.');
 }else{
  const totalDays=(x.sick+x.vestedSick)/x.day, divisor=(old||x.profile==='uft')?2:3;
  if(x.years>=10&&totalDays>=divisor) sickDays=Math.min(100,Math.min(totalDays,200)/divisor);
  else if(totalDays>0) messages.push('Sick leave does not meet the service or minimum-balance requirement.');
  // Non-managerial balances are combined and valued at the entered current rate.
  annualHours+=vestedHours; vestedHours=0;
 }
 const annual=annualHours*x.rate+vestedHours*x.vestedRate;
 const sick=sickDays*x.day*x.rate+vestedDays*x.day*x.vestedRate;
 const comp=x.comp*(manager?x.vestedRate:x.rate), subtotal=annual+sick+comp;
 const cap=manager?x.ceiling:null;
 if(manager&&cap<=0) throw new Error('Enter compensation earnable in the final 12 months.');
 const total=cap===null?subtotal:Math.min(subtotal,cap);
 return {annual,sick,comp,subtotal,total,reduction:subtotal-total,cap,annualHours:annualHours+vestedHours,sickDays:sickDays+vestedDays,messages};
}
if(typeof module!=='undefined') module.exports={calculate}; else root.LeaveCalculator={calculate};
})(typeof window==='undefined'?globalThis:window);
