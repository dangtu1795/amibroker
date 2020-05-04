/*
** AmiBroker/Win32 scripting Example
**
** File:	Export.js
** Created:	Tomasz Janeczko, December 12th, 1999
** Purpose:	Exports quotations to CSV file
** Language: 	JScript (Windows Scripting Host)
*/

function FormatFloat( number )
{
	number = 0.001 * Math.round( number * 1000 );
	str = number.toString();

	return str.substring( 0, str.indexOf(".") + 4 );
}

var oAB = WScript.CreateObject("Broker.Application");
var fso = new ActiveXObject("Scripting.FileSystemObject");

var oStocks = oAB.Stocks;

Ticker = oAB.ActiveDocument.Name;

oStock = oStocks( Ticker );

var Qty = oStock.Quotations.Count; 

WScript.Echo("Export of " + Ticker + " start" );

f = fso.OpenTextFile( Ticker + ".csv", 2, true );

f.WriteLine("$SEPARATOR ,");
f.WriteLine("$FORMAT Ticker,Date_YMD,Open,High,Low,Close,Volume")

for( i = 0; i < Qty; i++ )
{
	oQuote = oStock.Quotations( i );

	var oDate = new Date( oQuote.Date );

	f.WriteLine( 	oStock.Ticker + "," + 
			oDate.getFullYear() + "-" + (oDate.getMonth()+1) + "-" + oDate.getDate() + "," + 
			FormatFloat( oQuote.Open ) + "," + 
			FormatFloat( oQuote.High ) + "," +
			FormatFloat( oQuote.Low ) + "," +
			FormatFloat( oQuote.Close ) + "," + 
			Math.round( oQuote.Volume )  );
}

f.Close();

WScript.Echo("Export finished" );