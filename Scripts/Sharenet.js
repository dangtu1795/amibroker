/* 	Script:  	Sharenet DN file importer
   	File: 		Sharenet.js
	Create date:	30 March 2000 (Sharenet)
	Last change:	16 December 2000 (Tomasz Janeczko)
	Purpose:	Import Sharenet DN files into Amibroker, and process HED files
	Version:	1.3


The record layout of the file is as follows (1st character of column = 1)

Field 			Start 		Length 
Name 			5 		9 
Date 			16 		6 
Close 			23 		8 
High 			32 		8 
Low 			41 		8 
Volume 			50 		8 
Sector Number 		59 		3 
Div. Yield % 		63 		3 
Earn Yield % 		67 		3 

All fields except for the name are left padded with spaces (i.e. right justified) 

Example:

    SASOL      000131     4980     5070     4800   625015  56 030 081
    SASOL-CD   000131     4850     4850     4750     7555  56 032 000 


Header file layout: (we only look at error corrections and renames)
*RSH OLDNAME SECTOR NEWNAME 
*ERR SHARENAME SECTOR DATE_OF ERROR (DDMMYY) CLOSE HIGH LOW VOL 

*/


/* Go through the date file and import all files in it */
/* Delete each file once done with it */


/* Global */
var FileSystemObject = new ActiveXObject("Scripting.FileSystemObject");
var AmiBroker = new ActiveXObject("Broker.Application");
var ForReading = 1;

var DataFolder = "C:\\snet\\";

if( WScript.Arguments.length > 0 )
{
	DataFolder = WScript.Arguments.Item( 0 ) + "\\";
}	

if( RunDownloader() )
{
	ImportSnet();
}


/* WScript.echo("Update Completed"); */


function RunDownloader()
{
	if( FileSystemObject.FileExists( "snetdn.exe" ) )
	{
		WshShell = new ActiveXObject("WScript.Shell");

		WshShell.Run( "snetdn.exe", 2, true);

		return true;
	}
	else
	{
		WScript.echo("Fatal error:\n\nCan not find Sharenet Downloader program (snetdn.exe) in\nthe current directory.\n\nHave you installed Sharenet downloader already?\n\nIf yes - correct the 'Initial directory' path for Sharenet downloader in the Tools->Customizedialog\n\notherwise please go to www.sharenet.co.za, download Sharenet Downloader program and install it.\n\nUpdate is now terminated." );
		return false;
	}	
}


function ReverseDate(InDate)
{
  var Month, Day, Year;

  Year  = parseInt(InDate.slice(4,6));
  Month = InDate.slice(2,4);
  Day   = InDate.slice(0,2);

  Year += (Year < 50) ? 2000 : 1900;

  dt = new Date(Year, Month, Day);

  return dt;

}



function ProcessHed(filename)
{
 var f, r;
 var date;
 var Sharename; 
 var quote;
 var stock;
 var ErrorArray, RenameArray;
 var RevDate;

  /* Open the ascii file */    
  try {
    f = FileSystemObject.OpenTextFile(filename + ".HED", ForReading);
  } catch (e) {
    WScript.echo("DATE file refers to non-existant .HED file. Was download OK?");  
    return;
  }

  /* Read the file, one line at a time */
  while (!f.AtEndOfStream) {

    r = f.ReadLine();
    var z = r.slice(1,4);
   
    if (r.slice(z) == "ERR") {
      ErrorArray 	= r.split(" ");
      RevDate 	= ReverseDate(ErrorArray[3]);
      date		= new Date(RevDate);
      Sharename 	= ErrorArray[1];
      stock		= AmiBroker.Stocks.Add(Sharename);
      quote 		= stock.Quotations.Add(date.getVarDate());
      quote.Close	= parseFloat(ErrorArray[4]);
      quote.High	= parseFloat(ErrorArray[5]);
      quote.Low	= parseFloat(ErrorArray[6]);
      quote.Volume	= parseFloat(ErrorArray[7]);
      quote.Open	= 0; 
    } 
	else 
	if (z == "RSH") 
	{
      RenameArray = r.split(" ");
	  try
	  {
		stock		= AmiBroker.Stocks.Add(RenameArray[1]); /* This is the current name */
		stock.Ticker = RenameArray[3];
	  }
	  catch(e)
	  {
		/* Ignore errors */
	  }
    }
  }

  f.Close(); 
  AmiBroker.RefreshAll();
  return;	 
}
   

function RunAmiUpdate(filename)
{
  AmiBroker.Import(0, filename + ".DN", "sharenet.format");
  AmiBroker.RefreshAll();
}



function ImportSnet(filename)
{
 var f, r;

  if( ! FileSystemObject.FolderExists( DataFolder ) )
  {
	WScript.echo("A data folder:\n" + DataFolder + "\ndoes not exist.\nIf your data are in another location please enter the path to this location\nto the 'Arguments' edit field in the Tools->Customize dialog.");
	return;
  }

  /* Open the ascii file */    
  try {
    f = FileSystemObject.OpenTextFile( DataFolder +"date", ForReading);
  } catch (e) {
    WScript.echo("There is no date file! Were any files downloaded?"); 
    return;
  }

  if( AmiBroker.Version >= "3.42" )
  {
	  AmiBroker.Log( 0 ); // delete import log
  }

  /* Read the file, one line at a time */
  while (!f.AtEndOfStream) {
    r = f.ReadLine();
	try
	{
		ProcessHed( DataFolder + r);
	}
	catch( e ) { };

    RunAmiUpdate( DataFolder + r);
    try {
      FileSystemObject.DeleteFile( DataFolder + r + ".dn");
      FileSystemObject.DeleteFile( DataFolder + r + ".hed");
    } catch (e) {
	/* Ignore errors */
    }
  }
  f.Close();

  try {
    FileSystemObject.DeleteFile( DataFolder + "date");
  } catch (e) {
    /* Ignore errors */
  }

  if( AmiBroker.Version >= "3.42" )
  {
	  AmiBroker.Log( 2 ); // ask and display if there are any errors
  }

  return;

}

