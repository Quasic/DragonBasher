# internal, assigns expired timestamp
$e=60;
if ($new eq "Ga") { $e=3600;  } # minnow
if ($new eq "Gd") { $e=86400; } # crab
if ($new eq "Ge") { $e=86400; } # carp
if ($new eq "Za") { $e=0;    }  # nothing
if ($new eq "Zj") { $e=60;    } # fire
$e=sprintf("%08x", $cstamp+$e);
1;
