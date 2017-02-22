#!/usr/bin/perl
#
# Queville v11.0, Land of the Dragon Basher
# Quintrix and Crew Software
#
# Released as Creative Commons BY-NC, where 
# 'non-commercial' includes games created meaning
# games cannot have money, coins, bank notes,
# credits, or any other economic system. See license.txt
# for full credits.
#
# http://creativecommons.org/licenses/by-nc/2.0/
#
# need to add a check to make sure created player name does
# not start with the letters npc
# 
use CGI::Carp qw( fatalsToBrowser );
$| = -1;
require "11-config.pl";
$cstamp=time(); $timestamp=sprintf("%08x", $cstamp);
srand();
print "Content-type: text/html\n";
print "Cache-Control: no-cache, no-store, must-revalidate\n";
print "Expires: Fri, 30 Oct 1998 14:19:41 GMT\n";
print "Pragma: no-cache\n\n";
if ($serverstatus eq "Off") { print "pop=server has been turned off\n"; exit; }
if ($ENV{"REQUEST_METHOD"} eq 'GET') { $buffer = $ENV{'QUERY_STRING'}; } else { read(STDIN, $buffer, $ENV{'CONTENT_LENGTH'}); }
@pairs = split(/&/, $buffer); foreach $pair (@pairs) {
 ($name,$value)=split(/=/,$pair);
 $value =~ tr/+/ /; $value =~ s/%39/=/; $value =~ s/%([a-fA-F0-9][a-fA-F0-9])/pack("C", hex($1))/eg;
 $form{$name} = $value; #print qq~document.write("$name = $value<br>");\n ~;
}
## $form = (N)ame (P)swd (S)erver (C)ommand
if ($form{'c'} eq "external.js") {
  # loads external javascripts into client
  print "external.js";
  exit;
}

$form{'s'}=~s/[^A-Za-z0-9\-]//g;
$form{'c'}=~s/[^A-Za-z0-9\-]//g;
$form{'j'}=~s/[^A-Za-z0-9 -]//g;
$form{'d'}=~s/[^A-Za-z0-9]//g;
$form{'m'}=~s/[^A-Za-z0-9]//g;

$error="";
$filename=$form{'n'};
$server=$form{'s'};

$filename=~s/[^A-Za-z0-9]//g;
if ($filename ne $form{'n'}) { $error.="Invalid Character In Name\n"; }
if (length($filename)<3) { $error.="Name must be at least 3 characters\n"; }
if (length($filename)>16) { $error.="Name cannot be more than 16 characters\n"; }
$filename=lc($filename);
if (substr($filename,0,1) lt "a" || substr($filename,0,1) gt "z") { $error.="Name must start with a letter\n"; }
if (substr($filename,0,3) eq "npc") {  $error.="Restricted player name (npc)\n"; }

$pswd=$form{'p'}; $pswd=~s/[^A-Za-z0-9\!\#\*\(\)\-\+\[\]\,\.]//g;
if ($pswd ne $form{'p'}) { $error.="Invalid character in password\n"; }
if (length($pswd)<4) { $error.="Password must be at least 4 characters\n"; }
if (length($pswd)>32) { $pswd=substr($pswd,0,32); }

if (!$filename) {
  ## if no username provided, send client as response 
  open (FILE, "client.htm"); @client=<FILE>; close FILE;
  foreach $line (@client) { chomp($line); if(substr($line,0,18)eq'//[configuration];'){print"DirBuild=\"$DirBuild\";\nDirChar=\"$DirChar\";\nDirItem=\"$DirItem\";\nDirKeys=\"$DirKeys\";\nDirTile=\"$DirTile\";\nMapSizeX=\"$MapSizeX\";\nMapSizeY=\"$MapSizeY\";\n";}else{ $line =~ s/\[htmlurl\]/$htmlurl/gi; print "$line\n"; }}
  exit;
}

require "player.pl";

if ($form{'c'} eq "create")   {
  do "create.pl"
} else {

  if ($filename eq "sysop") {
    ## special processing required for sysop account:
    ## server name = player name that has sysop access,
    ## thus password needs to be re-loaded from that player file
    if ($server) {
      open (FILE,"$datadir/11-dragon/passwords/$server.txt"); chomp ($playerpass=<FILE>); close FILE;
      if ($pswd ne $playerpass) { print "error=Password mismatch\n"; }
    } else {
      ## no server, so no login ... yes?? security check this 
    }
  } else { 
    if (-e "$datadir/11-dragon/passwords/$filename.txt") {
      open (FILE,"$datadir/11-dragon/passwords/$filename.txt"); chomp ($playerpass=<FILE>); close FILE;
      if ($pswd ne $playerpass) { print "error=Password mismatch\n"; }
    } else {
      print "error=Player file does not exist\n";
    }
  }
}

if ($server eq "" or $server eq '11-dragon') {
  ## display list of servers - can use dragon.htm as client for this purpose
  print "s=demo\n";
  print "s=queville\n";
  print "s=anarchy\n";
  print "servers=\n";
  exit;
}

$datadir.="/$server";

if (-e "$datadir") {} else {
  ## server does not exist
  print"error=Server does not exist\n";
  exit;
}

if ($error) {
  print "error=$error";
} else {
  &loadplayer($filename);
  # main loop starts here
  # execute movement commands first
  if ($form{'m'}) {
    $steps=5;
    while ($steps>0) {
      $step=substr($form{'m'},0,1);
      if ($step eq "l") { do "left.pl"; }
      if ($step eq "r") { do "right.pl"; }
      if ($step eq "u") { do "up.pl"; }
      if ($step eq "d") { do "down.pl"; }
      if ($step eq ".") { $TickObj.="."; }
      $form{'m'}=substr($form{'m'},1);
      $steps--;
      if (!$form{'m'}) { $steps=0; }
    }
    print "moves=$form{'m'}\n";
  }

  # old movement commands
  if (substr($form{'c'},0,4) eq "left") { do "left.pl"; }
  if (substr($form{'c'},0,5) eq "right") { do "right.pl"; }
  if (substr($form{'c'},0,2) eq "up") { do "up.pl"; }
  if (substr($form{'c'},0,4) eq "down") { do "down.pl"; }

  # execute command 
  
  if ($form{'c'} eq "login")     { do "login.pl"; }
  if ($form{'c'} eq "logout")     { do "logout.pl"; }
  if ($form{'c'} eq "char") { do "char.pl"; }
  if ($form{'c'} eq "tele") { do "tele.pl"; }
  if ($form{'c'} eq "wear") { do "wear.pl"; }
  if ($form{'c'} eq "remove") { do "remove.pl"; print "dinv=1\n"; do "token.pl"; $form{'c'}="refresh"; }
  if ($form{'c'} eq "get") { do "get.pl"; }
  if ($form{'c'} eq "drop") { do "drop.pl"; }
  if ($form{'c'} eq "static") { do "static.pl"; }
  if ($form{'c'} eq "delete") { do "delete.pl"; }
  if ($form{'c'} eq "add") { do "add.pl"; }
  if ($form{'c'} eq "inventory") { do "inventory.pl"; }
  if ($form{'c'} eq "chat") { do "chat.pl"; }
  if ($form{'c'} eq "key") { do "key.pl"; }
  if ($form{'c'} eq "tile") { do "tile.pl"; }
  ## keep refresh as last command, other commands can then issue it
  if ($form{'c'} eq "refresh") {  if ($cstamp>$player{'one'}) { do "one.pl"; } do "refresh.pl"; }

  #$player{'inven'}="Z000000000";
  #$player{'inven'}.="$player{'inven'}$player{'inven'}$player{'inven'}$player{'inven'}$player{'inven'}";
  #$player{'inven'}.="$player{'inven'}$player{'inven'}$player{'inven'}";
  
  #substr($player{'inven'},0,2)="S1";
  # $player{'map'}="B2"; 
  &saveplayer($filename);
  # print "pop=$player{'map'} $player{'z'}\n";
  # print "pop=$player{'tmap'} $player{'tz'}\n";
  # print "pop=$player{'inven'}\n";
  # print "pop=$cstamp \n";
  # print "pop=$timestamp \n";
  # print "pop=$player{'object'}\n";
  # print "pop=$player{'tmap'}-$player{'tz'}\n";

}

##
## known issues:
##
## invalid map during login bug is in token.pl
## dinv result code displays inventory before the refresh
##
