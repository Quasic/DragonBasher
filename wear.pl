## external wear item

$Wearing=substr($player{'object'},4,length($player{'object'}));

if (length($form{'j'})==2) {
  $class=substr($form{'j'},0,1); $class=~s/[^A-Z]//g;
  $type=substr($form{'j'},1,1); $type=~s/[^0-9a-z]//g;
  
  if ($player{'inven'}=~/$class$type/) {
    if ($type ne "") {
      if ($class eq "L") {
        $Wearing=substr($Wearing,0,index($Wearing,"L")).substr($Wearing,index($Wearing,"L")+2,length($Wearing));
        $Wearing=substr($Wearing,0,index($Wearing,"M")).substr($Wearing,index($Wearing,"M")+2,length($Wearing));
        $Wearing=substr($Wearing,0,index($Wearing,"S")).substr($Wearing,index($Wearing,"S")+2,length($Wearing));
        $Wearing.="$class$type";
      }
      if ($class eq "M") {
        $Wearing=substr($Wearing,0,index($Wearing,"L")).substr($Wearing,index($Wearing,"L")+2,length($Wearing));
        $Wearing=substr($Wearing,0,index($Wearing,"M")).substr($Wearing,index($Wearing,"M")+2,length($Wearing));
        $Wearing=substr($Wearing,0,index($Wearing,"S")).substr($Wearing,index($Wearing,"S")+2,length($Wearing));
        $Wearing.="$class$type";
      }
      if ($class eq "S") {
        $Wearing=substr($Wearing,0,index($Wearing,"L")).substr($Wearing,index($Wearing,"L")+2,length($Wearing));
        $Wearing=substr($Wearing,0,index($Wearing,"M")).substr($Wearing,index($Wearing,"M")+2,length($Wearing));
        $Wearing=substr($Wearing,0,index($Wearing,"S")).substr($Wearing,index($Wearing,"S")+2,length($Wearing));
        $Wearing.="$class$type";
      }
    } 

    $player{'object'}.='L' if length($player{'object'})<4;
    $player{'object'}=substr($player{'object'},0,4).$Wearing;
    print "dinv=1\n";
    do "token.pl";
  }
}
  
$form{'c'}="refresh";

1;
