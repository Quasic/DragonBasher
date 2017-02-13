# external, chat handler
$version="1.0";


$expiration=sprintf("%08x", $cstamp-500);

$metachannel=$form{'j'};
@tokens=split(' ',$player{"lastchat-$metachannel"});
%lastchat=();
$lastchannel=substr($tokens[0],8);
if($expiration gt $tokens[0]){
  $laststamp=$expiration;#enforce expiration so no ghost chat
}else{
  $laststamp=substr($tokens[0],0,8);
  for($i=1;$i<@tokens;$i++){$lastchat{$tokens[$i]}=1;}
}
$thischat="";
$allownewchat=1;
@chat=();
if($metachannel eq'global'){
  $channel=$metachannel;
  $mainchannel=$channel;
  &getchat();
}elsif($metachannel eq'team'){
  for (substr($player{'object'},4)){
   $channel=/L0/?'black':/L1/?'blue':/L2/?'red':/L3/?'green':/L4/?'yellow':/L5/?'purple':/L6/?'orange':'teamless';
  }
  $mainchannel=$channel;
  if($lastchannel ne $channel){
    push(@chat,'        '.($channel eq'teamless'?$lastchannel?"You have left the $lastchannel team chat.":'Welcome to the teamless channel!':"<font color=$channel>You have entered the $channel team channel.</font>"));
    $lastchannel=$channel;
  }
  &getchat();
}elsif($metachannel eq'view'){
  $a1=substr($player{'map'},0,1); $a2=$a1; $a2++; if ($a2>$MapEdgeY) { $a2="A"; } 
  $b1=substr($player{'map'},1,1); $b2=$b1; $b2++; if ($b2>$MapEdgeX) { $b2="0"; }
  $map1="$a1$b1"; $map2="$a1$b2"; $map3="$a2$b1"; $map4="$a2$b2";
  $mainchannel=$player{'tmap'};
  $channel=$map1;&getchat();
  $channel=$map2;&getchat();
  $channel=$map3;&getchat();
  $channel=$map4;&getchat();
}else{
  exit;#keep url editor from creating unused channels
}

if($form{'q'} ne '') {#new chat to add
 ##$form{'q'}=~s/&/&amp;/g; #this line disables user html entities
 ##$form{'q'}=~s/`/&#96;/g;#backtick (!important!)
 #$form{'q'}=~s/\t/ /g;#tab to space
 $form{'q'}=~s/[`\0-\x1f]//g;#filters out controls, backtick
 $form{'q'}=~s/\s+$//g;#removes trailing whitespace
 ##$form{'q'}=~s/\$/&#36;/g;#$(...) (?important?)
 #$form{'q'}=~s/[^a-zA-Z0-9 =,\.\/_!'#\$\%&\*\(\)\+\[\]\?]//g;#Queville keyboard characters only
 #$form{'q'}=~s/[^ !#\%&'\(\)\+,\-\.0-9;=\@A-Z\[\]\^_a-z\{\}~]//g;#Filename safe characters only
 if($form{'q'} ne '') {
  #following 2 lines may not be needed, if install will handle it?
  #if (!-d "$datadir/chat") { mkdir "$datadir/chat"; }
  #if (!-w "$datadir/chat") { chmod 0777, "$datadir/chat"; }
  if (!-d "$datadir/chat/$mainchannel") { mkdir "$datadir/chat/$mainchannel"; }
  if (!-w "$datadir/chat/$mainchannel") { chmod 0777, "$datadir/chat/$mainchannel"; }
  if ($allownewchat){
    $f="$timestamp $player{'name'} ";
    if(length($f)+length($form{'q'})*2>255){
      $i=(255-length($f))>>1;#255 is max filename length, $i is max message length
      push(@chat,'xxxxxxxy<font color=red>Length Error, Chat dropped: '.substr($form{'q'},$i).'</font>');
      $form{'q'}=substr($form{'q'},0,$i);
    }
    $f="$datadir/chat/$mainchannel/$f".unpack('H*',$form{'q'});
    #print "chat=$player{'name'} (FILE): $f\n";
    open (FILE,">$f");
    print FILE 'blah';
    close FILE;
    $form{'q'}=~s/</&lt;/g;#prepare for HTML output
    $form{'q'}=~s/>/&gt;/g;
    if(-e $f){
      push(@chat,"$timestamp$player{'name'}: ".$form{'q'});
      $thischat.=" $mainchannel-$player{'name'}";
    }else{
      push(@chat,'xxxxxxxx<font color=red>System Error, Chat dropped: '.$form{'q'}.'</font>');
    }
  }else{
    push(@chat,'xxxxxxxx<font color=red>Bulk Error, Chat dropped: '.$form{'q'}.'</font>');
}}}
#push(@chat,"xxxxxxy0$player{'name'} [lastchatcode (stamp/expiration) / thischatcode]: ".$player{"lastchat-$metachannel"}." ($laststamp/$expiration) / $timestamp$thischat");
$player{"lastchat-$metachannel"}="$timestamp$lastchannel$thischat";
if(@chat){
 @chat=sort @chat;
 $thischat=substr($chat[0],8);
 for ($i=1;$i<@chat;$i++) {$thischat.='<BR>'.substr($chat[$i],8);}#strip timestamps
 print "chat=$thischat\n";
}


#filter out chats to delete or sort and send
sub getchat(){
  opendir(DIR,"$datadir/chat/$channel/"); @data=readdir(DIR); closedir(DIR);
  foreach $line (@data) {
    chomp($line);
    if (length($line)<3) { next; }
    @tokens = split(/ /, $line);
    if ($tokens[0] lt $laststamp){
      unlink("$datadir/chat/$channel/$line") if $tokens[0] lt $expiration;
      next;
    }
    next if $tokens[0] eq $laststamp and $lastchat{"$channel-$tokens[1]"};
    if ($tokens[0] eq $timestamp){
      if ($tokens[1] eq $player{'name'} and $channel eq $mainchannel){
        $allownewchat='';
        next;
      }
      $thischat.=" $channel-$tokens[1]";
    }
    $tokens[2]=pack('H*',$tokens[2]);#file should already be filtered, but just in case...
    $tokens[2]=~s/[`\0-\x1f]//g;#make sure backtick and controls are stripped
    #$tokens[2]=~s/\$/&#36;/g;#$(...) (?important?)
    $tokens[2]=~s/</&lt;/g;#prepare for HTML output
    $tokens[2]=~s/>/&gt;/g;
    push(@chat, "$tokens[0]$tokens[1]: $tokens[2]");
  }
}

1;