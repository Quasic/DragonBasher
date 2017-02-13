## internal, sends chat to any channel
## parameters:
# $chat is the text to send
# $chatchannel tells where to send it
# $chatname is the name to use (some names may have special meaning in chat.pl)
## returns:
# $chat is the chat sent, which may be truncated due to length limit or errors

#following 2 lines may not be needed, if install will handle it? (also in chat.pl)
#if (!-d "$datadir/chat") { mkdir "$datadir/chat"; }
#if (!-w "$datadir/chat") { chmod 0777, "$datadir/chat"; }
if (!-d "$datadir/chat/$chatchannel") { mkdir "$datadir/chat/$chatchannel"; }
if (!-w "$datadir/chat/$chatchannel") { chmod 0777, "$datadir/chat/$chatchannel"; }
$f="$timestamp $chatname";
if(length($f)+length($chat)*2>255){
  $i=(255-length($f))>>1;#255 is max filename length, $i is max message length
  $chat=substr($chat,0,$i);
}
$f="$datadir/chat/$chatchannel/$f".unpack('H*',$chat);
open (FILE,">$f");
print FILE 'blah';
close FILE;
# to update current user immediately, could do("chat.pl") after setting $form{...} to not post anything, but not sure that's needed, and might be better to merge with chat.pl in that case

1;