# external, sysop key menu
$version="1.0";

$form{'j'}="Zd-86400"; #key

$f=0;

# hardcode sysop names here

if(lc($player{'name'}) eq "joe") { $f=1; }
if(lc($player{'name'}) eq "heather") { $f=1; }
if(lc($player{'name'}) eq "quaczar") { $f=1; }
if(lc($player{'name'}) eq "warkings") { $f=1; }

if (lc($server) eq "anarchy"){
  if (lc($player{'name'}) eq "usmarine") { $f=1; }
  if (lc($player{'name'}) eq "taz") { $f=1; }
}

#
# this line activtes all player servers
# if (lc($server) eq lc($player{'name'}) { $f=1; }
#

if ($server eq "demo") { $f=1; }

if ($f) {
  ($item,$estamp)=split(/\-/,$form{'j'});
  $slot=index($player{'inven'},"Za");
  if (substr($player{'inven'},$slot,2)eq'Za') {  
    if ($slot>-1) {
      if($item=~/^[A-Z][0-9a-z]$/){
        $player{'inven'}=substr($player{'inven'},0,$slot).$item.sprintf("%08x",+$cstamp+$estamp).substr($player{'inven'},$slot+10);
        do 'inv.pl';
        print "dinv=1\n";
      } else {
        print "pop=invalid item\n";
      }
    } else {
      print "pop=mismatch\n";
    }
  } else {
    print "pop=no space $f\n";
  }
}

1;
