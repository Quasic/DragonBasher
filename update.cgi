#!/usr/bin/perl

#
# copy files from $datadir/server/ to /cgi-bin/install/
#

use CGI::Carp qw( fatalsToBrowser );

$| = -1;

print "Content-type: text/html\n";
print "Cache-Control: no-cache, no-store, must-revalidate\n";
print "Expires: Fri, 30 Oct 1998 14:19:41 GMT\n";
print "Pragma: no-cache\n\n";

if ($ENV{"REQUEST_METHOD"} eq 'GET') { $buffer = $ENV{'QUERY_STRING'}; } else { read(STDIN, $buffer, $ENV{'CONTENT_LENGTH'}); }
@pairs = split(/&/, $buffer);
foreach $pair (@pairs) {
 ($name,$value)=split(/=/,$pair);
 $value =~ tr/+/ /;
 $value =~ s/%39/=/;
 $value =~ s/%([a-fA-F0-9][a-fA-F0-9])/pack("C", hex($1))/eg;
 $form{$name} = $value;
 #print qq~document.write("$name = $value<br>");\n ~;
}

#
# create directories
# copy files into directories
# 
