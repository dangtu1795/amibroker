/*
** AmiBroker/Win32 scripting Example
**
** File:		Cleanup.js
** Created:		Tomasz Janeczko, December 2th, 2000
** Purpose:		Cleanup the database from not traded stocks
** Language: 	JScript (Windows Scripting Host)
*/

/* detection threshold (in days)  */
var Threshold = 30; // one month for example 
/* by default do not delete */
var DeleteByDefault = false;
/* ask the user for the decision */
var AskUser = true;
/* a timeout to wait until default route (no deletion) is taken */
var Timeout = 5;

var oAB = new ActiveXObject("Broker.Application");
var fso = new ActiveXObject("Scripting.FileSystemObject");
var Shell = new ActiveXObject("WScript.Shell");


var oStocks = oAB.Stocks;

var MiliSecInDay = 24 * 60 * 60 * 1000;

var Continue = true;

var StockQty = oStocks.Count;

var oStocksToDelete = new Array;
var oStocksNotTraded = new Array;

if( ! AskUser ) WScript.Echo("Cleanup script started" );

for( i = 0; i < StockQty && Continue; i++ )
{
	oStock = oStocks( i );

	var Qty = oStock.Quotations.Count; 

	var response = 0;

	if( Qty > 0 )
	{
		oQuote = oStock.Quotations( Qty - 1 );

		var oDate = new Date( oQuote.Date );

		var Today = new Date();

		DaysNotTraded = Math.floor( ( Today - oDate )/MiliSecInDay );

		if( DaysNotTraded > Threshold )
		{
			if( AskUser ) response = Shell.popup( oStock.Ticker + " is not traded since " + oDate.toLocaleString() + " (" + DaysNotTraded + " days).\nDo you wish to delete it?\n(Press Cancel to end the process)", Timeout, "Confirm delete", 3 + 256 );
			else          response = -1; /* default */
		}
	}
	else
	{
		if( AskUser ) response = Shell.popup( oStock.Ticker + " has no quotes. Do you wish to delete it?",  Timeout, "Confirm delete", 3 + 256 );
		else          response = -1; /* default */
	}

	/* change default route if needed */
	if( response == -1 && DeleteByDefault ) response = 6;

	switch( response )
	{
		case -1:/* Timeout - fallback to no */
		case 7: /* No */
				oStocksNotTraded[ oStocksNotTraded.length ] = oStock.Ticker;
				break;
		case 6: /* Yes */
				oStocksToDelete[ oStocksToDelete.length ] = oStock.Ticker;
				break;
		case 2: /* Cancel */
				Continue = false;
				break;
		default: break;
	}
}

if( oStocksToDelete.length > 0 && Shell.popup( "You are now about to delete " + oStocksToDelete.length + " stock(s).\nDo you wish to proceed?" , 0, "Confirm delete", 4 + 256 ) == 6 )
{
	for( i = 0; i < oStocksToDelete.length; i++ )
	{
		oStocks.Remove( oStocksToDelete[ i ]  );
	}

	oAB.RefreshAll();
}

if( oStocksNotTraded.length > 0 && Shell.popup( "There are " + oStocksNotTraded.length + " not traded stock(s) detected but not deleted by your choice.\nDo you wish to save their tickers to \"nottraded.txt\" file?" , 0, "Confirm save", 4 + 256 ) == 6 )
{
	f = fso.OpenTextFile( "nottraded.txt", 2, true );	

	for( i = 0; i < oStocksNotTraded.length; i++ )
	{
		f.WriteLine( oStocksNotTraded[ i ]  );
	}

	f.Close();
}

WScript.Echo("Cleanup script finished" );