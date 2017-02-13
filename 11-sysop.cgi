#!/usr/bin/perl -w
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
use CGI; use CGI::Carp qw( fatalsToBrowser ); use File::Copy qw(copy); no warnings "all"; $| = -1; 
require "11-config.pl";
$ver="1.0";
print "Content-type: text/html\n";
print "Cache-Control: no-cache, must-revalidate\n";
print "Pragma: no-cache\n\n";
#foreach $key (sort keys(%ENV)) { print "$key = $ENV{$key}<br>"; } exit;
if ($ENV{"REQUEST_METHOD"} eq 'GET') { $buffer = $ENV{'QUERY_STRING'}; } else { read(STDIN, $buffer, $ENV{'CONTENT_LENGTH'});}
@pairs = split(/&/, $buffer);
foreach $pair (@pairs) {
  ($name, $value) = split(/=/, $pair);
  $value =~ tr/+/ /;
  $value =~ s/%39/=/g;
  $value =~ s/%0D/\\n/g;
  $value =~ s/%([a-fA-F0-9][a-fA-F0-9])/pdatadirack("C", hex($1))/eg;
  $FORM{$name} = $value;
  #print "$name = $value<p>";
}

$FORM{'name'}=~s/[^A-Za-z0-9\-]//g;
$FORM{'name'}=lc($FORM{'name'});
$FORM{'dir'}=~s/[^A-Za-z0-9 .:\/\?\&\-\_\=\+]//g;
$FORM{'htmldir'}=~s/[^A-Za-z0-9 .:\/\?\&\-\_\=\+]//g;
$FORM{'htmlurl'}=~s/[^A-Za-z0-9 .:\/\?\&\-\_\=\+]//g;
$FORM{'pswd'}=~s/[^A-Za-z0-9\!\#\*\(\)\-\+\[\]\,\.]//g;

$cstamp=time();
($sec,$min,$hour,$day,$month,$year) = (localtime($cstamp)); 
$timestamp=sprintf("%0.4d%0.2d%0.2d%0.2d%0.2d%0.2d",$year+1900,$month+1,$day,$hour,$min,$sec);
$currenttime=sprintf("%0.4d-%0.2d-%0.2d %0.2d:%0.2d:%0.2d",$year+1900,$month+1,$day,$hour,$min,$sec);

print qq~
<html><head><style>
.contain { position: relative; width: 960px; margin-left: auto; margin-right: auto; clear: both; }
.inputsubmit { text-align: left; margin-right: 400; }
label { width: 150px; float: left; text-align: right; clear: both; margin-right: .2em; }
</style></head><body><div class=contain><center><p><br><br>
Dragon Server $ver<p>Can you imagine a world without money?? Let's try!!<p><br><br>~; #'

if ($adminkey eq "password") {
  print "To install new servers, set \$adminkey<br>to a secure password in the 11-config.pl file.<p>";
  exit;
}

if (-d "$htmldir/11-gfx") {
  &gfxname
  # print "<p>remap<p>";&remap;
} else {
  print "no gfx directory: unzip a gfx pack into $htmldir/11-gfx<p>";
}

#   if ($FORM{'gfx'}) {
#     #
#     # install new graphics
#     #
#   } else {
#     print qq~<p>New Graphic Images Detected in gfx/ directory.
#     <br>CHMOD 0777 "public_html" directory for write-access
#     <br>and enter Admin Key to install new graphics.<p>
#     <form>Admin Key: <input type=password name=pswd value="$FORM{'pswd'}">
#     <input type=submit name=gfx value="Install"></form><p><br><br><br>~;
#   }
# }

if (-e "$htmldir/jquery-1.11.2.min.js") {} else {
  copy "jquery-1.11.2.min.js", "$htmldir/jquery-1.11.2.min.js" or die "copy jquery-1.11.2.min.js $htmldir/jquery-1.11.2.min.js\n\n$!\n\n";
}

if (-e "$datadir") {} else {
  print "<p>MKDIR $datadir<p>";
  if (!-d "$datadir") { mkdir "$datadir" or die "mkdir $datadir\n\n$!"; }
  if (!-w "$datadir") { chmod 0777, "$datadir" or die "chmod 0777, \"$datadir\";\n\n$!\n\n"; } #"  
}

if (-d "$datadir/11-dragon/passwords") {} else {
  &MakeDir("$datadir/11-dragon");
  &MakeDir("$datadir/11-dragon/passwords");
}
if (-e "$datadir/11-dragon/passwords/sysop.txt") {} else {
  open (FILE, ">$datadir/11-dragon/passwords/sysop.txt");
  print FILE "$adminkey";
  close FILE;
}

if (!$FORM{'name'}) {
  if (!$FORM{'dir'}) {
    opendir(DIR,"$datadir/");
    @servers = readdir(DIR);   
    closedir(DIR);
    print "Select Server for Sysop Menu:<p>";
    foreach $server (@servers) {
      chomp($server); 
      if (substr($server,0,1) ne ".") {
        if (substr($server,0,1) ne "1") {
          print qq~<a href="?name=$server">$server</a><br>~;
        }
     }
    }
    print qq~<form><p><br><br> 
      <input type=text size=8 name="name" value="demo">
      <input type=hidden name=pswd value="$FORM{'pswd'}">
      or enter new Server Name: <input type=submit name=install value="Install"></form></div>~;
      exit;
    }
  } else {
     if (-e "$datadir/$FORM{'name'}/") {
       ##
       ## does pswd eq sysop password?
       ##
       print qq~<p>Dragon Server installed.You may now <a href="$htmlurl/cgi-bin/11-dragon/11-dragon.cgi?s=$FORM{'name'}">Login</a>.~;
       print qq~<p><a href=$htmlurl/11-gfx/11-viewer.htm>Tileset Graphics Viewer Script</a><p>~;
     } else {
       if ($adminkey eq "password") {
         print "<p>To install new servers, set \$adminkey<br>to a secure password in the 11-config.pl file.<p>";
         exit;
       } else {
         if ($FORM{'pswd'} ne $adminkey) {
           print qq~<form><input type=hidden name=name value="$FORM{'name'}">
           <p>Admin Key to install $FORM{'name'}<p><input type=password name=pswd value="">
           <input type=submit value="Install"></form>~;
         } else {
            ##
            ##  install new server
            ##
            print qq~Installing $FORM{'name'}...<p>~;
            $datadir.="/".$FORM{'name'};
            &MakeDir("$datadir");
            &MakeDir("$datadir/characters");
            &MakeDir("$datadir/chat");
            &MakeDir("$datadir/creatures");
            &MakeDir("$datadir/dynamic");
            &MakeDir("$datadir/maps");
            &MakeDir("$datadir/players");
            &MakeDir("$datadir/server");
            &MakeDir("$datadir/static");
            &MakeDir("$datadir/tokens");
            &MakeDir("$datadir/quests");
            print qq~<p>Dragon Server installed.You may now <a href="$htmlurl/cgi-bin/11-dragon/11-dragon.cgi?s=$FORM{'name'}">Login</a>.<p>~; 
            print qq~<p><a href=$htmlurl/11-gfx/11-viewer.htm>Tileset Graphics Viewer Script</a><p>~;
         }
     }
  }
}



sub MakeDir {
  if (!-d "$_[0]") { mkdir "$_[0]" or die "mkdir $_[0] = $!"; }
  if (!-w "$_[0]") { chmod 0777, "$_[0]" or die "chmod 0777 $_[0] = $!"; }
}    

sub CopyHTML {
  if (!-e "$htmldir/$_[0]") { unlink("$htmldir/$_[0]"); }
  copy "$_[0]", "$htmldir/$_[0]" or die "$_[0] $!";
  print " $_[0] ";
}

sub  gfxname {
  # run-once routine to convert numeral tiles into lower case letters
  unlink"$htmldir/11-gfx/t/$_[0]p.png"; rename "$htmldir/11-gfx/t/$_[0]f.png", "$htmldir/11-gfx/t/$_[0]p.png";
  unlink"$htmldir/11-gfx/t/$_[0]o.png"; rename "$htmldir/11-gfx/t/$_[0]e.png", "$htmldir/11-gfx/t/$_[0]o.png";
  unlink"$htmldir/11-gfx/t/$_[0]n.png"; rename "$htmldir/11-gfx/t/$_[0]d.png", "$htmldir/11-gfx/t/$_[0]n.png";
  unlink"$htmldir/11-gfx/t/$_[0]m.png"; rename "$htmldir/11-gfx/t/$_[0]c.png", "$htmldir/11-gfx/t/$_[0]m.png";
  unlink"$htmldir/11-gfx/t/$_[0]l.png"; rename "$htmldir/11-gfx/t/$_[0]b.png", "$htmldir/11-gfx/t/$_[0]l.png";
  unlink"$htmldir/11-gfx/t/$_[0]k.png"; rename "$htmldir/11-gfx/t/$_[0]a.png", "$htmldir/11-gfx/t/$_[0]k.png";
  unlink"$htmldir/11-gfx/t/$_[0]j.png"; rename "$htmldir/11-gfx/t/$_[0]9.png", "$htmldir/11-gfx/t/$_[0]j.png";
  unlink"$htmldir/11-gfx/t/$_[0]i.png"; rename "$htmldir/11-gfx/t/$_[0]8.png", "$htmldir/11-gfx/t/$_[0]i.png";
  unlink"$htmldir/11-gfx/t/$_[0]h.png"; rename "$htmldir/11-gfx/t/$_[0]7.png", "$htmldir/11-gfx/t/$_[0]h.png";
  unlink"$htmldir/11-gfx/t/$_[0]g.png"; rename "$htmldir/11-gfx/t/$_[0]6.png", "$htmldir/11-gfx/t/$_[0]g.png";
  unlink"$htmldir/11-gfx/t/$_[0]f.png"; rename "$htmldir/11-gfx/t/$_[0]5.png", "$htmldir/11-gfx/t/$_[0]f.png";
  unlink"$htmldir/11-gfx/t/$_[0]e.png"; rename "$htmldir/11-gfx/t/$_[0]4.png", "$htmldir/11-gfx/t/$_[0]e.png";
  unlink"$htmldir/11-gfx/t/$_[0]d.png"; rename "$htmldir/11-gfx/t/$_[0]3.png", "$htmldir/11-gfx/t/$_[0]d.png";
  unlink"$htmldir/11-gfx/t/$_[0]c.png"; rename "$htmldir/11-gfx/t/$_[0]2.png", "$htmldir/11-gfx/t/$_[0]c.png";
  unlink"$htmldir/11-gfx/t/$_[0]b.png"; rename "$htmldir/11-gfx/t/$_[0]1.png", "$htmldir/11-gfx/t/$_[0]b.png";
  unlink"$htmldir/11-gfx/t/$_[0]a.png"; rename "$htmldir/11-gfx/t/$_[0]0.png", "$htmldir/11-gfx/t/$_[0]a.png";
}

sub gfxmap {
  # run-once to convert old tilesets to new new tilesets
  if (-e "$datadir/maps/$_[0]/t.txt") {
    print " $datadir/maps/$_[0]/t.txt ";
    open (FILE, "$datadir/maps/$_[0]/t.txt") or die $!; $tileset=<FILE>; close (FILE);
    #
    # replace old tiles with new tiles
    # 0 1 2 3 4 5 6 7 8 9 a b c d e f
    # a b c d e f g h i j k l m n o p 
    #
    $tileset=~s/Af/Ap/g; $tileset=~s/Ae/Ao/g; $tileset=~s/Ad/An/g; $tileset=~s/Ac/Am/g; $tileset=~s/Ab/Al/g; $tileset=~s/Aa/Ak/g; $tileset=~s/A9/Aj/g; $tileset=~s/A8/Ai/g; $tileset=~s/A7/Ah/g; $tileset=~s/A6/Ag/g; $tileset=~s/A5/Af/g; $tileset=~s/A4/Ae/g; $tileset=~s/A3/Ad/g; $tileset=~s/A2/Ac/g; $tileset=~s/A1/Ab/g; $tileset=~s/A0/Aa/g;
    $tileset=~s/Bf/Bp/g; $tileset=~s/Be/Bo/g; $tileset=~s/Bd/Bn/g; $tileset=~s/Bc/Bm/g; $tileset=~s/Bb/Bl/g; $tileset=~s/Ba/Bk/g; $tileset=~s/B9/Bj/g; $tileset=~s/B8/Bi/g; $tileset=~s/B7/Bh/g; $tileset=~s/B6/Bg/g; $tileset=~s/B5/Bf/g; $tileset=~s/B4/Be/g; $tileset=~s/B3/Bd/g; $tileset=~s/B2/Bc/g; $tileset=~s/B1/Bb/g; $tileset=~s/B0/Ba/g;
    $tileset=~s/Cf/Cp/g; $tileset=~s/Ce/Co/g; $tileset=~s/Cd/Cn/g; $tileset=~s/Cc/Cm/g; $tileset=~s/Cb/Cl/g; $tileset=~s/Ca/Ck/g; $tileset=~s/C9/Cj/g; $tileset=~s/C8/Ci/g; $tileset=~s/C7/Ch/g; $tileset=~s/C6/Cg/g; $tileset=~s/C5/Cf/g; $tileset=~s/C4/Ce/g; $tileset=~s/C3/Cd/g; $tileset=~s/C2/Cc/g; $tileset=~s/C1/Cb/g; $tileset=~s/C0/Ca/g;
    $tileset=~s/Df/Dp/g; $tileset=~s/De/Do/g; $tileset=~s/Dd/Dn/g; $tileset=~s/Dc/Dm/g; $tileset=~s/Db/Dl/g; $tileset=~s/Da/Dk/g; $tileset=~s/D9/Dj/g; $tileset=~s/D8/Di/g; $tileset=~s/D7/Dh/g; $tileset=~s/D6/Dg/g; $tileset=~s/D5/Df/g; $tileset=~s/D4/De/g; $tileset=~s/D3/Dd/g; $tileset=~s/D2/Dc/g; $tileset=~s/D1/Db/g; $tileset=~s/D0/Da/g;
    $tileset=~s/Ef/Ep/g; $tileset=~s/Ee/Eo/g; $tileset=~s/Ed/En/g; $tileset=~s/Ec/Em/g; $tileset=~s/Eb/El/g; $tileset=~s/Ea/Ek/g; $tileset=~s/E9/Ej/g; $tileset=~s/E8/Ei/g; $tileset=~s/E7/Eh/g; $tileset=~s/E6/Eg/g; $tileset=~s/E5/Ef/g; $tileset=~s/E4/Ee/g; $tileset=~s/E3/Ed/g; $tileset=~s/E2/Ec/g; $tileset=~s/E1/Eb/g; $tileset=~s/E0/Ea/g;
    $tileset=~s/Ff/Fp/g; $tileset=~s/Fe/Fo/g; $tileset=~s/Fd/Fn/g; $tileset=~s/Fc/Fm/g; $tileset=~s/Fb/Fl/g; $tileset=~s/Fa/Fk/g; $tileset=~s/F9/Fj/g; $tileset=~s/F8/Fi/g; $tileset=~s/F7/Fh/g; $tileset=~s/F6/Fg/g; $tileset=~s/F5/Pf/g; $tileset=~s/F4/Fe/g; $tileset=~s/F3/Fd/g; $tileset=~s/F2/Fc/g; $tileset=~s/F1/Fb/g; $tileset=~s/F0/Fa/g;
    $tileset=~s/Gf/Gp/g; $tileset=~s/Ge/Go/g; $tileset=~s/Gd/Gn/g; $tileset=~s/Gc/Gm/g; $tileset=~s/Gb/Gl/g; $tileset=~s/Ga/Gk/g; $tileset=~s/G9/Gj/g; $tileset=~s/G8/Gi/g; $tileset=~s/G7/Gh/g; $tileset=~s/G6/Gg/g; $tileset=~s/G5/Gf/g; $tileset=~s/G4/Ge/g; $tileset=~s/G3/Gd/g; $tileset=~s/G2/Gc/g; $tileset=~s/G1/Gb/g; $tileset=~s/G0/Ga/g;
    $tileset=~s/Hf/Hp/g; $tileset=~s/He/Ho/g; $tileset=~s/Hd/Hn/g; $tileset=~s/Hc/Hm/g; $tileset=~s/Hb/Hl/g; $tileset=~s/Ha/Hk/g; $tileset=~s/H9/Hj/g; $tileset=~s/H8/Hi/g; $tileset=~s/H7/Hh/g; $tileset=~s/H6/Hg/g; $tileset=~s/H5/Hf/g; $tileset=~s/H4/He/g; $tileset=~s/H3/Hd/g; $tileset=~s/H2/Hc/g; $tileset=~s/H1/Hb/g; $tileset=~s/H0/Ha/g;
    $tileset=~s/If/Ip/g; $tileset=~s/Ie/Io/g; $tileset=~s/Id/In/g; $tileset=~s/Ic/Im/g; $tileset=~s/Ib/Il/g; $tileset=~s/Ia/Ik/g; $tileset=~s/I9/Ij/g; $tileset=~s/I8/Ii/g; $tileset=~s/I7/Ih/g; $tileset=~s/I6/Ig/g; $tileset=~s/I5/If/g; $tileset=~s/I4/Ie/g; $tileset=~s/I3/Id/g; $tileset=~s/I2/Ic/g; $tileset=~s/I1/Ib/g; $tileset=~s/I0/Ia/g;
    $tileset=~s/Jf/Jp/g; $tileset=~s/Je/Jo/g; $tileset=~s/Jd/Jn/g; $tileset=~s/Jc/Jm/g; $tileset=~s/Jb/Jl/g; $tileset=~s/Ja/Jk/g; $tileset=~s/J9/Jj/g; $tileset=~s/J8/Ji/g; $tileset=~s/J7/Jh/g; $tileset=~s/J6/Jg/g; $tileset=~s/J5/Jf/g; $tileset=~s/J4/Je/g; $tileset=~s/J3/Jd/g; $tileset=~s/J2/Jc/g; $tileset=~s/J1/Jb/g; $tileset=~s/J0/Ja/g;
    $tileset=~s/Kf/Kp/g; $tileset=~s/Ke/Ko/g; $tileset=~s/Kd/Kn/g; $tileset=~s/Kc/Km/g; $tileset=~s/Kb/Kl/g; $tileset=~s/Ka/Kk/g; $tileset=~s/K9/Kj/g; $tileset=~s/K8/Ki/g; $tileset=~s/K7/Kh/g; $tileset=~s/K6/Kg/g; $tileset=~s/K5/Kf/g; $tileset=~s/K4/Ke/g; $tileset=~s/K3/Kd/g; $tileset=~s/K2/Kc/g; $tileset=~s/K1/Kb/g; $tileset=~s/K0/Ka/g;
    $tileset=~s/Lf/Lp/g; $tileset=~s/Le/Lo/g; $tileset=~s/Ld/Ln/g; $tileset=~s/Lc/Lm/g; $tileset=~s/Lb/Ll/g; $tileset=~s/La/Lk/g; $tileset=~s/L9/Lj/g; $tileset=~s/L8/Li/g; $tileset=~s/L7/Lh/g; $tileset=~s/L6/Lg/g; $tileset=~s/L5/Lf/g; $tileset=~s/L4/Le/g; $tileset=~s/L3/Ld/g; $tileset=~s/L2/Lc/g; $tileset=~s/L1/Lb/g; $tileset=~s/L0/La/g;
    $tileset=~s/Mf/Mp/g; $tileset=~s/Me/Mo/g; $tileset=~s/Md/Mn/g; $tileset=~s/Mc/Mm/g; $tileset=~s/Mb/Ml/g; $tileset=~s/Ma/Mk/g; $tileset=~s/M9/Mj/g; $tileset=~s/M8/Mi/g; $tileset=~s/M7/Mh/g; $tileset=~s/M6/Mg/g; $tileset=~s/M5/Mf/g; $tileset=~s/M4/Me/g; $tileset=~s/M3/Md/g; $tileset=~s/M2/Mc/g; $tileset=~s/M1/Mb/g; $tileset=~s/M0/Ma/g;
    $tileset=~s/Nf/Np/g; $tileset=~s/Ne/No/g; $tileset=~s/Nd/Nn/g; $tileset=~s/Nc/Nm/g; $tileset=~s/Nb/Nl/g; $tileset=~s/Na/Nk/g; $tileset=~s/N9/Nj/g; $tileset=~s/N8/Ni/g; $tileset=~s/N7/Nh/g; $tileset=~s/N6/Ng/g; $tileset=~s/N5/Nf/g; $tileset=~s/N4/Ne/g; $tileset=~s/N3/Nd/g; $tileset=~s/N2/Nc/g; $tileset=~s/N1/Nb/g; $tileset=~s/N0/Na/g;
    $tileset=~s/Of/Op/g; $tileset=~s/Oe/Oo/g; $tileset=~s/Od/On/g; $tileset=~s/Oc/Om/g; $tileset=~s/Ob/Ol/g; $tileset=~s/Oa/Ok/g; $tileset=~s/O9/Oj/g; $tileset=~s/O8/Oi/g; $tileset=~s/O7/Oh/g; $tileset=~s/O6/Og/g; $tileset=~s/O5/Of/g; $tileset=~s/O4/Oe/g; $tileset=~s/O3/Od/g; $tileset=~s/O2/Oc/g; $tileset=~s/O1/Ob/g; $tileset=~s/O0/Oa/g;
    $tileset=~s/Pf/Pp/g; $tileset=~s/Pe/Po/g; $tileset=~s/Pd/Pn/g; $tileset=~s/Pc/Pm/g; $tileset=~s/Pb/Pl/g; $tileset=~s/Pa/Pk/g; $tileset=~s/P9/Pj/g; $tileset=~s/P8/Pi/g; $tileset=~s/P7/Ph/g; $tileset=~s/P6/Pg/g; $tileset=~s/P5/Pf/g; $tileset=~s/P4/Pe/g; $tileset=~s/P3/Pd/g; $tileset=~s/P2/Pc/g; $tileset=~s/P1/Pb/g; $tileset=~s/P0/Pa/g;
    $tileset=~s/Qf/Qp/g; $tileset=~s/Qe/Qo/g; $tileset=~s/Qd/Qn/g; $tileset=~s/Qc/Qm/g; $tileset=~s/Qb/Ql/g; $tileset=~s/Qa/Qk/g; $tileset=~s/Q9/Qj/g; $tileset=~s/Q8/Qi/g; $tileset=~s/Q7/Qh/g; $tileset=~s/Q6/Qg/g; $tileset=~s/Q5/Qf/g; $tileset=~s/Q4/Qe/g; $tileset=~s/Q3/Qd/g; $tileset=~s/Q2/Qc/g; $tileset=~s/Q1/Qb/g; $tileset=~s/Q0/Qa/g;
    $tileset=~s/Rf/Rp/g; $tileset=~s/Re/Ro/g; $tileset=~s/Rd/Rn/g; $tileset=~s/Rc/Rm/g; $tileset=~s/Rb/Rl/g; $tileset=~s/Ra/Rk/g; $tileset=~s/R9/Rj/g; $tileset=~s/R8/Ri/g; $tileset=~s/R7/Rh/g; $tileset=~s/R6/Rg/g; $tileset=~s/R5/Rf/g; $tileset=~s/R4/Re/g; $tileset=~s/R3/Rd/g; $tileset=~s/R2/Rc/g; $tileset=~s/R1/Rb/g; $tileset=~s/R0/Ra/g;
    $tileset=~s/Sf/Sp/g; $tileset=~s/Se/So/g; $tileset=~s/Sd/Sn/g; $tileset=~s/Sc/Sm/g; $tileset=~s/Sb/Sl/g; $tileset=~s/Sa/Sk/g; $tileset=~s/S9/Sj/g; $tileset=~s/S8/Ti/g; $tileset=~s/S7/Sh/g; $tileset=~s/S6/Sg/g; $tileset=~s/S5/Sf/g; $tileset=~s/S4/Se/g; $tileset=~s/S3/Sd/g; $tileset=~s/S2/Sc/g; $tileset=~s/S1/Sb/g; $tileset=~s/S0/Sa/g;
    $tileset=~s/Tf/Tp/g; $tileset=~s/Te/To/g; $tileset=~s/Td/Tn/g; $tileset=~s/Tc/Tm/g; $tileset=~s/Tb/Tl/g; $tileset=~s/Ta/Tk/g; $tileset=~s/T9/Tj/g; $tileset=~s/T8/Si/g; $tileset=~s/T7/Th/g; $tileset=~s/T6/Tg/g; $tileset=~s/T5/Tf/g; $tileset=~s/T4/Te/g; $tileset=~s/T3/Td/g; $tileset=~s/T2/Tc/g; $tileset=~s/T1/Tb/g; $tileset=~s/T0/Ta/g;
    $tileset=~s/Uf/Up/g; $tileset=~s/Ue/Uo/g; $tileset=~s/Ud/Un/g; $tileset=~s/Uc/Um/g; $tileset=~s/Ub/Ul/g; $tileset=~s/Ua/Uk/g; $tileset=~s/U9/Uj/g; $tileset=~s/U8/Ui/g; $tileset=~s/U7/Uh/g; $tileset=~s/U6/Ug/g; $tileset=~s/U5/Uf/g; $tileset=~s/U4/Ue/g; $tileset=~s/U3/Ud/g; $tileset=~s/U2/Uc/g; $tileset=~s/U1/Ub/g; $tileset=~s/U0/Ua/g;
    $tileset=~s/Vf/Vp/g; $tileset=~s/Ve/Vo/g; $tileset=~s/Vd/Vn/g; $tileset=~s/Vc/Vm/g; $tileset=~s/Vb/Vl/g; $tileset=~s/Va/Vk/g; $tileset=~s/V9/Vj/g; $tileset=~s/V8/Vi/g; $tileset=~s/V7/Vh/g; $tileset=~s/V6/Vg/g; $tileset=~s/V5/Vf/g; $tileset=~s/V4/Ve/g; $tileset=~s/V3/Vd/g; $tileset=~s/V2/Vc/g; $tileset=~s/V1/Vb/g; $tileset=~s/V0/Va/g;
    $tileset=~s/Wf/Wp/g; $tileset=~s/We/Wo/g; $tileset=~s/Wd/Wn/g; $tileset=~s/Wc/Wm/g; $tileset=~s/Wb/Wl/g; $tileset=~s/Wa/Wk/g; $tileset=~s/W9/Wj/g; $tileset=~s/W8/Wi/g; $tileset=~s/W7/Wh/g; $tileset=~s/W6/Wg/g; $tileset=~s/W5/Wf/g; $tileset=~s/W4/We/g; $tileset=~s/W3/Wd/g; $tileset=~s/W2/Wc/g; $tileset=~s/W1/Wb/g; $tileset=~s/W0/Wa/g;
    $tileset=~s/Xf/Xp/g; $tileset=~s/Xe/Xo/g; $tileset=~s/Xd/Xn/g; $tileset=~s/Xc/Xm/g; $tileset=~s/Xb/Xl/g; $tileset=~s/Xa/Xk/g; $tileset=~s/X9/Xj/g; $tileset=~s/X8/Xi/g; $tileset=~s/X7/Xh/g; $tileset=~s/X6/Xg/g; $tileset=~s/X5/Xf/g; $tileset=~s/X4/Xe/g; $tileset=~s/X3/Xd/g; $tileset=~s/X2/Xc/g; $tileset=~s/X1/Xb/g; $tileset=~s/X0/Xa/g;
    $tileset=~s/Yf/Yp/g; $tileset=~s/Ye/Yo/g; $tileset=~s/Yd/Yn/g; $tileset=~s/Yc/Ym/g; $tileset=~s/Yb/Yl/g; $tileset=~s/Ya/Yk/g; $tileset=~s/Y9/Yj/g; $tileset=~s/Y8/Yi/g; $tileset=~s/Y7/Yh/g; $tileset=~s/Y6/Yg/g; $tileset=~s/Y5/Yf/g; $tileset=~s/Y4/Ye/g; $tileset=~s/Y3/Yd/g; $tileset=~s/Y2/Yc/g; $tileset=~s/Y1/Yb/g; $tileset=~s/Y0/Ya/g;
    $tileset=~s/Zf/Zp/g; $tileset=~s/Ze/Zo/g; $tileset=~s/Zd/Zn/g; $tileset=~s/Zc/Zm/g; $tileset=~s/Zb/Zl/g; $tileset=~s/Za/Zk/g; $tileset=~s/Z9/Zj/g; $tileset=~s/Z8/Zi/g; $tileset=~s/Z7/Zh/g; $tileset=~s/Z6/Zg/g; $tileset=~s/Z5/Zf/g; $tileset=~s/Z4/Ze/g; $tileset=~s/Z3/Zd/g; $tileset=~s/Z2/Zc/g; $tileset=~s/Z1/Zb/g; $tileset=~s/Z0/Za/g;
    
    open (FILE, ">$datadir/maps/$_[0]/t.txt") or die $!; print FILE "$tileset\n"; close FILE;
    open (FILE, ">$datadir/maps/$_[0]/s.txt") or die $!; print FILE "$cstamp\n"; close FILE;
  }
}



sub remap {
    $newdatadir="$datadir/queville";
    $nextdatadir="$datadir/demo";
    $firstdatadir="$datadir";
    $datadir=$newdatadir;
    &gfxmap("A0"); &gfxmap("A1"); &gfxmap("A2"); &gfxmap("A3"); &gfxmap("A4"); &gfxmap("A5"); &gfxmap("A6"); &gfxmap("A7"); &gfxmap("A8"); &gfxmap("A9");
    &gfxmap("B0"); &gfxmap("B1"); &gfxmap("B2"); &gfxmap("B3"); &gfxmap("B4"); &gfxmap("B5"); &gfxmap("B6"); &gfxmap("B7"); &gfxmap("B8"); &gfxmap("B9");
    &gfxmap("C0"); &gfxmap("C1"); &gfxmap("C2"); &gfxmap("C3"); &gfxmap("C4"); &gfxmap("C5"); &gfxmap("C6"); &gfxmap("C7"); &gfxmap("C8"); &gfxmap("C9");
    &gfxmap("D0"); &gfxmap("D1"); &gfxmap("D2"); &gfxmap("D3"); &gfxmap("D4"); &gfxmap("D5"); &gfxmap("D6"); &gfxmap("D7"); &gfxmap("D8"); &gfxmap("D9");
    &gfxmap("E0"); &gfxmap("E1"); &gfxmap("E2"); &gfxmap("E3"); &gfxmap("E4"); &gfxmap("E5"); &gfxmap("E6"); &gfxmap("E7"); &gfxmap("E8"); &gfxmap("E9");
    &gfxmap("F0"); &gfxmap("F1"); &gfxmap("F2"); &gfxmap("F3"); &gfxmap("F4"); &gfxmap("F5"); &gfxmap("F6"); &gfxmap("F7"); &gfxmap("F8"); &gfxmap("F9");
    &gfxmap("G0"); &gfxmap("G1"); &gfxmap("G2"); &gfxmap("G3"); &gfxmap("G4"); &gfxmap("G5"); &gfxmap("G6"); &gfxmap("G7"); &gfxmap("G8"); &gfxmap("G9");
    &gfxmap("H0"); &gfxmap("H1"); &gfxmap("H2"); &gfxmap("H3"); &gfxmap("H4"); &gfxmap("H5"); &gfxmap("H6"); &gfxmap("H7"); &gfxmap("H8"); &gfxmap("H9");
    &gfxmap("I0"); &gfxmap("I1"); &gfxmap("I2"); &gfxmap("I3"); &gfxmap("I4"); &gfxmap("I5"); &gfxmap("I6"); &gfxmap("I7"); &gfxmap("I8"); &gfxmap("I9");
    &gfxmap("J0"); &gfxmap("J1"); &gfxmap("J2"); &gfxmap("J3"); &gfxmap("J4"); &gfxmap("J5"); &gfxmap("J6"); &gfxmap("J7"); &gfxmap("J8"); &gfxmap("J9");
    &gfxmap("K0"); &gfxmap("K1"); &gfxmap("K2"); &gfxmap("K3"); &gfxmap("K4"); &gfxmap("K5"); &gfxmap("K6"); &gfxmap("K7"); &gfxmap("K8"); &gfxmap("K9");
    $datadir=$nextdatadir;
    &gfxmap("A0"); &gfxmap("A1"); &gfxmap("A2"); &gfxmap("A3"); &gfxmap("A4"); &gfxmap("A5"); &gfxmap("A6"); &gfxmap("A7"); &gfxmap("A8"); &gfxmap("A9");
    &gfxmap("B0"); &gfxmap("B1"); &gfxmap("B2"); &gfxmap("B3"); &gfxmap("B4"); &gfxmap("B5"); &gfxmap("B6"); &gfxmap("B7"); &gfxmap("B8"); &gfxmap("B9");
    &gfxmap("C0"); &gfxmap("C1"); &gfxmap("C2"); &gfxmap("C3"); &gfxmap("C4"); &gfxmap("C5"); &gfxmap("C6"); &gfxmap("C7"); &gfxmap("C8"); &gfxmap("C9");
    &gfxmap("D0"); &gfxmap("D1"); &gfxmap("D2"); &gfxmap("D3"); &gfxmap("D4"); &gfxmap("D5"); &gfxmap("D6"); &gfxmap("D7"); &gfxmap("D8"); &gfxmap("D9");
    &gfxmap("E0"); &gfxmap("E1"); &gfxmap("E2"); &gfxmap("E3"); &gfxmap("E4"); &gfxmap("E5"); &gfxmap("E6"); &gfxmap("E7"); &gfxmap("E8"); &gfxmap("E9");
    &gfxmap("F0"); &gfxmap("F1"); &gfxmap("F2"); &gfxmap("F3"); &gfxmap("F4"); &gfxmap("F5"); &gfxmap("F6"); &gfxmap("F7"); &gfxmap("F8"); &gfxmap("F9");
    &gfxmap("G0"); &gfxmap("G1"); &gfxmap("G2"); &gfxmap("G3"); &gfxmap("G4"); &gfxmap("G5"); &gfxmap("G6"); &gfxmap("G7"); &gfxmap("G8"); &gfxmap("G9");
    &gfxmap("H0"); &gfxmap("H1"); &gfxmap("H2"); &gfxmap("H3"); &gfxmap("H4"); &gfxmap("H5"); &gfxmap("H6"); &gfxmap("H7"); &gfxmap("H8"); &gfxmap("H9");
    &gfxmap("I0"); &gfxmap("I1"); &gfxmap("I2"); &gfxmap("I3"); &gfxmap("I4"); &gfxmap("I5"); &gfxmap("I6"); &gfxmap("I7"); &gfxmap("I8"); &gfxmap("I9");
    &gfxmap("J0"); &gfxmap("J1"); &gfxmap("J2"); &gfxmap("J3"); &gfxmap("J4"); &gfxmap("J5"); &gfxmap("J6"); &gfxmap("J7"); &gfxmap("J8"); &gfxmap("J9");
    &gfxmap("K0"); &gfxmap("K1"); &gfxmap("K2"); &gfxmap("K3"); &gfxmap("K4"); &gfxmap("K5"); &gfxmap("K6"); &gfxmap("K7"); &gfxmap("K8"); &gfxmap("K9");
    $firstdatadir="$datadir";
    
    


}