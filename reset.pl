# external, resets player to blank (will be die routine)

$player{'inven'}="Z000000000";
$player{'inven'}.="$player{'inven'}$player{'inven'}$player{'inven'}$player{'inven'}$player{'inven'}";
$player{'inven'}.="$player{'inven'}$player{'inven'}$player{'inven'}";
do 'inv.pl';
print "pop=Reset\n";

1;
