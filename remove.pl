## external remove item

$Wearing=substr($player{'object'},4,length($player{'object'}));
$Wearing=~s/$form{'j'}//;
$player{'object'}=substr($player{'object'},0,4).$Wearing;

1;
