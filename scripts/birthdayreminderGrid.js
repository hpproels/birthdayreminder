displayAllBirthdays();
//console.log("Das Ende");

/**
* Output for all Birthdays as HTML DIV List in Order of next upcoming
*/
async function displayAllBirthdays() {

   
   /*
   may be later more options
   var maxDaysUntilNextBirthday = BirthdayReminderGlobal.getPref("extensions.birtdayreminder.maxDaysTillNextBirtday");
 
   */
	var maxDaysUntilBirthday = 365;
	var allBirthdays = await getAllBirthdays();
	var lGeburtstage = filterByNumberofDays(allBirthdays, maxDaysUntilBirthday);
	var headerDays = browser.i18n.getMessage("headerDays");
	var headerName = browser.i18n.getMessage("headerName");
	var headerAge = browser.i18n.getMessage("headerAge");
	var headerBirthday = browser.i18n.getMessage("headerBirthday");
	var headerEMail = browser.i18n.getMessage("headerEMail");
	lGeburtstage = filterDoubleEntries(lGeburtstage);
	
	lGeburtstage.sort(function(a,b) {
		return parseInt(a.daysUntilNextBirthday) - parseInt(b.daysUntilNextBirthday);
	});
	//console.log(lGeburtstage.length);
	
	var myHTML="<div class='grid-container' id='grid-container'>";
	var count=0;
	
	//TODO i18n + replace inline header names
	myHTML+="<div class='grid-item panel-section-header' id='"+count+"'>"+headerDays+"</div>";
	myHTML+="<div class='grid-item panel-section-header' id='"+count+"'>"+headerName+"</div>";
	myHTML+="<div class='grid-item panel-section-header' id='"+count+"'>"+headerAge+"</div>";
	myHTML+="<div class='grid-item panel-section-header' id='"+count+"'>"+headerBirthday+"</div>";
	myHTML+="<div class='grid-item panel-section-header' id='"+count+"'>"+headerEMail+"</div>";
	for (let c of lGeburtstage) {
		for (var prop in c) {
			if (prop=="primaryEmail"){
				myHTML+="<div class='grid-item panel-section-list panel-list-item' id='"+count+"'><a href='mailto:" + c[prop] +"'><img src='images/mail-send_dark.svg'></a></div>";
			} else {
				myHTML+="<div class='grid-item panel-section-list panel-list-item' id='"+count+"'>"+ c[prop] +"</div>";
			}
			count++;
		}
	}
	myHTML+="</div>";
	//console.log(myHTML);
	wrapper.insertAdjacentHTML('afterend', myHTML);
	
	await windowResize();
	
	//var styleObj = document.styleSheets[0].cssRules[0].style;
	//console.log(styleObj.cssText);
	//console.log(window.getComputedStyle());
}

/**
*	Read all Contacts from Adressbooks and get Details
*	return Array of Birthday Objects [{daysUntilNextBirthday,Name,Age,DateOfBirth,primaryEmail,contactID},...]
*/
async function getAllBirthdays() {
    //console.log("Starting addressBookTest");
	var allBirthdays = new Array();
	try {
		let allAddressBooks = await browser.addressBooks.list();

		for (let adb of allAddressBooks) {
			
			let contacts = await browser.contacts.list(adb.id);
			
			for (let c of contacts) {
				
				let contact = await browser.contacts.get(c.id);
				//console.log(contact);
				let sListBoxEntry = buildBirthdayObject(contact);
				if (sListBoxEntry!=null) {
					allBirthdays.push(sListBoxEntry);
				}
				//console.log(sListBoxEntry);
			}
		}
	} catch (error) {
		console.log("CallbackError");
	}
	/*
	for (let c of allBirthdays) {
	   console.log(c);
	}*/
	return allBirthdays;
}
/**
*	Parse Contacts
*	return Birthday Object {daysUntilNextBirthday,Name,Age,DateOfBirth,primaryEmail,contactID}
*/
function buildBirthdayObject(contact) {
	
	var lDateOfBirth = "";
	var birthYear = contact.properties.BirthYear;
	var birthMonth = contact.properties.BirthMonth;
	var birthDay = contact.properties.BirthDay;
	var lName = contact.properties.DisplayName;
	var primaryEmail = contact.properties.PrimaryEmail;
	var contactID = contact.id;
	var date_of_today = new Date();
	const options = {year: 'numeric', month: '2-digit', day: '2-digit' };

	// Geburtstage ohne Jahresangabe sind gültig
	if (typeof birthDay == 'undefined' || typeof birthMonth == 'undefined' ) {
		return null;
	}
    
	if (typeof birthYear != 'undefined' && !(Number.isNaN(birthYear))&& !(Number.isNaN(birthMonth)) && !(Number.isNaN(birthDay))) {
		lDateOfBirth = new Date(birthYear, birthMonth-1, birthDay);
		//console.log("2");
	} else if (!(Number.isNaN(birthMonth)) && !(Number.isNaN(birthDay))){
		lDateOfBirth = new Date(date_of_today.getFullYear(), birthMonth-1, birthDay);
		//console.log("Nur Monat und Tag");
	} 
	
	var lnextBirthday = calcDateOfNextBirthday(lDateOfBirth);
	var lAge = lnextBirthday.getFullYear()-lDateOfBirth.getFullYear(); //turns to be xx years old
	var ldaysUntilNextBirthday = days_between(lnextBirthday, date_of_today);

	//let sListBoxEntry = ldaysUntilNextBirthday + ";" + lName + ";"  + lAge + ";" + lDateOfBirth.toLocaleDateString() + ";" + primaryEmail; // maybe later + ";" + contactID ;
	let sListBoxEntry = new Object();
	sListBoxEntry.daysUntilNextBirthday = ldaysUntilNextBirthday;
	sListBoxEntry.Name = lName;
	sListBoxEntry.Age = lAge;
	sListBoxEntry.DateOfBirth = lDateOfBirth.toLocaleDateString(undefined, options);
	sListBoxEntry.primaryEmail = primaryEmail;
	//sListBoxEntry.contactID = contactID;
	//console.log(sListBoxEntry);
	return sListBoxEntry;
	
}

/**
* Resize Function becaus CSS Class outer div overfflow:auto seems not to work
* not necessary to call window.update(id, Object.width)...
*/
async function windowResize() {
	//console.log("grid-container");
	//var contentWidth = document.getElementById("grid-container").offsetWidth;
	//var contentHeight = document.getElementById("grid-container").offsetHeight;
	let window = await browser.windows.getCurrent(); //seems to be enough to initalize an auto resize or get the CSS working
}


/**
*	What are double entries? 
*	Object equality seems to be stupid - but may work
*	But what is the propability to have the same name and birthdate in a private addressbook ??? Propability for Germany 2 people same name, same date would be 1=100% .  
* 	To avoid this propability, email must be equal as well.
*/
function filterDoubleEntries(lGeburtstage) {
	//var lBirthdays = [];
	
	//completly equal Object entries - former method for string comparison
	let lBirthdays = lGeburtstage.filter(function(item, pos, self) {
		return self.indexOf(item) == pos;
	});
	
	//Second check for Similar entries (name, birth date, email)
	lGeburtstage = lBirthdays;
	for (let i=0; i<lGeburtstage.length; i++) {
		
		var sSpalten1 = lGeburtstage[i];
		
		var count=0;
		for (let j = i;j<lGeburtstage.length; j++) {		
			var sSpalten2 = lGeburtstage[j];
			if ((sSpalten2.primaryEmail==sSpalten1.primaryEmail)&& (sSpalten2.Name==sSpalten1.Name)&&(sSpalten2.DateOfBirth==sSpalten1.DateOfBirth)){
				count++;
			}
			if (count>1) {
				lBirthdays.splice(j,1);
			}	
		}
   } // for
   return lBirthdays;

}

/**
*	Function for removing elements form the output for birthday events, which have more days to go than given in maxDaysUntilNextBirthday
*/
function filterByNumberofDays(allBirthdays, maxDaysUntilNextBirthday) {

	// only display birthdays in range
	var lGeburtstage = new Array();
	var lGeburtstage2 = allBirthdays;

	for (var i=0; i<lGeburtstage2.length; i++) {
		
		let sListBoxEntry = lGeburtstage2[i];
		let ldaysUntilNextBirthday = sListBoxEntry.daysUntilNextBirthday;
		
		if (parseInt(ldaysUntilNextBirthday)<=parseInt(maxDaysUntilNextBirthday)) {
			lGeburtstage.push(lGeburtstage2[i]);
		} else {
			//console.log("ACHTUNG: " + lGeburtstage2[i] );
		}
	} // for

	/*
	for (let c of lGeburtstage) {
	   console.log(c);
	}*/
	return lGeburtstage;
}



/**
*	param Date of Birth
*	return next Birthday
*/
function calcDateOfNextBirthday(lDateOfBirth) {

   var date_of_today = new Date();
   var lDoB_Year = lDateOfBirth.getFullYear();
   var lDoB_Month= lDateOfBirth.getMonth()+1;
   var lDoB_Day = lDateOfBirth.getDate();

   var lnextBirthday = new Date(lDateOfBirth);
   lnextBirthday.setFullYear(date_of_today.getFullYear());


   if (days_between(lnextBirthday, date_of_today)<0) {
	  lnextBirthday = new Date(date_of_today.getFullYear()+1, lDoB_Month-1, lDoB_Day);
   }
   return lnextBirthday;
}


/**
* This function calculates the number of days between two dates.
*/

function days_between(date1, date2) {

	   // The number of milliseconds in one day
	   var ONE_DAY = 1000 * 60 * 60 * 24

	   date1.setHours(0);
	   date2.setHours(0);
	   date1.setMinutes(0);
	   date2.setMinutes(0);
	   date1.setSeconds(0);
	   date2.setSeconds(0);

	   // Convert both dates to milliseconds
	   var date1_ms = date1.getTime()
	   var date2_ms = date2.getTime()

	   // Calculate the difference in milliseconds
	   var difference_ms = date1_ms - date2_ms

	   // Convert back to days and return
	   return Math.round(difference_ms/ONE_DAY)

}

// not used
/*
function calculateAge(birthday) {
	var today = new Date();
	var birthDate = new Date(birthday);
	var age = today.getFullYear() - birthDate.getFullYear();
	var m = today.getMonth() - birthDate.getMonth();
	if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
		age = age - 1;
	}
	return age;
}
*/