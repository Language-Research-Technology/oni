import {getLogger} from "./logger.js";

const log = getLogger();

// To get the current user's Terms & Conditions:
// [GET] /terms-and-conditions this endpoint has the following functionality:
// Getting the CoManage person-id (for the given user) to use in request #3
// https://spaces.at.internet2.edu/display/COmanage/CoPerson+API#CoPersonAPI-View(perIdentifier)
// Getting the Terms and Conditions
// https://spaces.at.internet2.edu/display/COmanage/CoTermsAndConditions+API#CoTermsAndConditionsAPI-View(perCO)
// Getting the accepted terms (for the given user)
// https://spaces.at.internet2.edu/display/COmanage/CoTAndCAgreement+API#CoTAndCAgreementAPI-View(perCOPerson)
// After this information is retrieved, the response is an array of agreements
// If terms are updated they will be removed from the array. 
// If the given term/condition was accepted in the past, it will be added to the array.
// For the POST request to accept the Ts&Cs invoke the following:
// https://spaces.at.internet2.edu/display/COmanage/CoTAndCAgreement+API#CoTAndCAgreementAPI-Add

export async function getTerms({configuration}) {
  try {
    log.debug('getCoManageTerms');     
    const conf = configuration.api.authentication['identity'];
    const credentials = Buffer.from(`${conf.admin.username}:${conf.admin.apiKey}`).toString('base64');
    const terms = `/co_terms_and_conditions/${conf.terms.id}.json`;
    const url = `${conf.admin.host}${terms}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'json/application;charset=UTF-8'
      }
    });
    if(response.ok) {
      const data = await response.json();
      const terms = data?.CoTermsAndConditions;
      if(terms?.length > 0) {
        const data = terms[0];          
        return {
          id: data?.Id,
          body: data?.Body,
          url: data?.Url,
          description: data?.Description
        };
      } else {
        throw new Error(`Error fetching terms for ID: ${conf.terms.id} Status: ${response.status} ${response.statusText}`);
      }
    } else {
      throw new Error(`Error fetching terms ID: ${conf.terms.id} Status: ${response.status} ${response.statusText}`);
    }
  } catch (e) {
    return {error: e.message};
  }
}

export async function termsAggrement({configuration, personId}) {
  try {
    log.debug('getCoManageTermsAggrement');
    const conf = configuration.api.authentication['identity'];
    const credentials = Buffer.from(`${conf.admin.username}:${conf.admin.apiKey}`).toString('base64');
    const termsAgreement = `/co_t_and_c_agreements.json?copersonid=${personId}`;
    const url = `${conf.admin.host}${termsAgreement}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'json/application;charset=UTF-8'
      }
    });
    if(response.ok) {
    const json = await response.json();
    let aggreed = false;
    if(json?.CoTAndCAgreements?.length > 0) {
      for(const agreement of json?.CoTAndCAgreements) {
        if(agreement?.CoTermsAndConditionsId === conf.terms.id) {
          aggreed = true;
        }
      }
    } 
    return aggreed;
  } else { 
      throw new Error(`Error fetching terms agreement for person: ${personId} Status: ${response.status} ${response.statusText}`);
    }
  } catch (e) {
    return {error: e.message}
  }
}

export async function agreeTerms({configuration, personId}) {
  try {
    log.debug('postAgreeToTermsAgreement');
    const conf = configuration.api.authentication['identity'];
    const credentials = Buffer.from(`${conf.admin.username}:${conf.admin.apiKey}`).toString('base64');
    const termsAgreement = `/co_t_and_c_agreements.json`;
    const url = `${conf.admin.host}${termsAgreement}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'json/application;charset=UTF-8'
      },
      body: JSON.stringify({
        "RequestType": "CoTAndCAgreements",
        "Version": "1.0",
        "CoTAndCAgreements":
        [
          {
            "Version": "1.0",
            "CoTermsAndConditionsId": conf.terms.id,
            "Person": {
              "Type": "CO",
              "Id": personId
            }
          }
        ]
      })
    });
    if(!response.ok) {
      throw new Error(`Error accepting termsId ${conf.terms.id} Status: ${response.status} ${response.statusText}`);
    } else {
      const data = await response.json();
      return data;
    }
  } catch (e) {
    return {error: e.message};
  }
}



export async function getPersonId({configuration, user}) {
  try {
    log.debug('getCoManagePersonId');
    const conf = configuration.api.authentication['identity'];
    const credentials = Buffer.from(`${conf.admin.username}:${conf.admin.apiKey}`).toString('base64');
    const person = `/co_people.json?coid=${conf.admin.group}&search.identifier=${user.providerId}`;
    const url = `${conf.admin.host}${person}`;
    const response = await fetch(url, {
      method: 'GET',    
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'json/application;charset=UTF-8'
      }
    });
    if(!response.ok) {
      throw new Error(`Error fetching person ${user.providerId} Status: ${response.status} ${response.statusText}`);
    } else {      
      const data = await response.json();
      if(data?.CoPeople?.length > 0) {
        const personId = data?.CoPeople[0]?.Id;
        return personId;
      } else {
        return null;
      }
    }
  } catch (e) {
    return {error: e.message}
  }
}
