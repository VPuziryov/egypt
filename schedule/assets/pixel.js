(function(){
 !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=true;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=true;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
 fbq('init','675997335920840');fbq('track','PageView');
 let elapsed=0,start=null,timer=null,sent=false;
 function pause(){if(start!==null){elapsed+=performance.now()-start;start=null;}clearTimeout(timer);}
 function resume(){if(sent||document.hidden||start!==null)return;start=performance.now();timer=setTimeout(function(){pause();if(document.hidden)return;if(elapsed>=7000){sent=true;fbq('trackCustom','ViewContent_EgyptSchedule_7s');}else resume();},Math.max(0,7000-elapsed));}
 document.addEventListener('visibilitychange',()=>document.hidden?pause():resume());window.addEventListener('pagehide',pause);window.addEventListener('pageshow',resume);resume();
})();
