##external, logs the player out

if ($player{'token'}) { unlink "$datadir/tokens/$player{'token'}.txt"; }
print 'logout=';

1;
