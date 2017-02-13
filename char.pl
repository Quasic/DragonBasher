## external, sets character object to $form{'d'}

$sex=substr($form{'d'},0,1);
if ($sex eq "M" || $sex eq "F") {
  $style=substr($form{'d'},1,1); $style=~s/[^0-9]//g;
  if ($style) {
    $cloth=substr($form{'d'},2,1); $cloth=~s/[^A-Za-z0-9]//g;
    $player{'object'}="$sex$style$cloth"."R";
    do "token.pl";
    $form{'c'}="refresh";
    print "hpop=\n";    
  } 
}


1;
