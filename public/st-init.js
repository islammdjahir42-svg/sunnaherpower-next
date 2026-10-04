(function(w,d,u,k){
  w.ServerTrack=w.ServerTrack||{};
  if(!Array.isArray(w.serverTrackQueue)) w.serverTrackQueue=[];
  w.st=function(){w.serverTrackQueue.push(Array.prototype.slice.call(arguments));};
  var s=d.createElement('script');
  s.async=1;
  var randomPath=Math.random().toString(36).substring(2,15);
  s.src=u+'/lib/'+randomPath+'?key='+k;
  var h=d.getElementsByTagName('script')[0];
  h.parentNode.insertBefore(s,h);
})(window,document,'https://data.sunnaherpower.com','UT50NMDG9RN6IHNZBDBTRWF5SKA4R5N2F414CBTL');
