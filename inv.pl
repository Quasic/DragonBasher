## internal, sends inventory to client without timestamps
$inv=''; for ($i=0; $i<$NumInven;$i++) { $inv.=substr($player{'inven'},$i*10,2); } print "inv=$inv\n"; 1;