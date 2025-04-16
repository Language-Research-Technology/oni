//import {getUser} from "./user.js";
import {createUserMemberships} from "./userMembership.js";
import {getGroupMembership} from "../services/cilogon.js"
import {getLogger} from "../services/logger.js";
import * as utils from "../services/utils.js";

const log = getLogger();

// To get the current user's Terms & Conditions:
// [GET] /terms-and-conditions this endpoint has the following functionality:
// Getting the CoManage person-id (for the given user) to use in request #3
// https://spaces.at.internet2.edu/display/COmanage/CoPerson+API#CoPersonAPI-View(perIdentifier)
// Getting the Terms and Conditions
// https://spaces.at.internet2.edu/display/COmanage/CoTermsAndConditions+API#CoTermsAndConditionsAPI-View(perCO)
// Getting the accepted terms (for the given user)
// https://spaces.at.internet2.edu/display/COmanage/CoTAndCAgreement+API#CoTAndCAgreementAPI-View(perCOPerson)
// After this information is retrieved, the response is the terms and conditions 
// (request #2) which was updated to include a new Accepted key which is generated based on the response from request #3. 
// If the given term/condition was accepted in the response in request #3 then it's True, otherwise False.
// For the POST request to accept the Ts&Cs invoke the following:
// https://spaces.at.internet2.edu/display/COmanage/CoTAndCAgreement+API#CoTAndCAgreementAPI-Add

export async function getTerms({configuration}) {
  try {
    log.debug('getCoManageTerms');     
    
    const conf = configuration.api.authentication['identity'];
    const credentials = Buffer.from(`${conf.admin.username}:${conf.admin.apiKey}`).toString('base64');
    const api = conf.api;
    const terms = `/co_terms_and_conditions/${conf.terms.id}.json`;
    const url = `${conf.admin.host}${terms}`;
    console.log(url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'json/application;charset=UTF-8'
      }
    });
    if(!response.ok) {
      throw new Error(`Error fetching terms for COID ${conf.admin.group} Status: ${response.status} ${response.statusText}`);
    }else{
      const data = await response.json();
      const terms = data?.CoTermsAndConditions;
      if(terms?.length > 0) {
        const data = terms[0];          
        console.log('Response data:', data);
        return {
          id: data?.Id,
          body: data?.Body,
          url: data?.Url,
          description: data?.Description
        };
      }
    }
  } catch (e) {
    return {error: e}
  }
}

export async function termsAggrement({configuration, personId}) {
  try {
    log.debug('getCoManageTerms');

    const conf = configuration.api.authentication['identity'];
    const credentials = Buffer.from(`${conf.admin.username}:${conf.admin.apiKey}`).toString('base64');
    const api = conf.api;
    const termsAgreement = `/co_t_and_c_agreements.json?copersonid=${personId}`;
    const url = `${conf.admin.host}${termsAgreement}`;
    console.log(url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'json/application;charset=UTF-8'
      }
    });
    console.log('termsAggrement');
    const data = response;
    console.log('Response data:', data);
    const json = await response.json();
    console.log('Response data:', json);
    let aggreed = false;
    if(json?.CoTAndCAgreements?.length > 0) {
      for(const agreement of json?.CoTAndCAgreements) {
        if(agreement?.CoTermsAndConditionsId === conf.terms.id) {
          aggreed = true;
        }
      }
    } 
    return aggreed;
  } catch (e) {
    return {error: e}
  }
}

export async function agreeTerms({configuration, personId}) {
  try {
    log.debug('getCoTermsAgreement');

    const conf = configuration.api.authentication['identity'];
    const credentials = Buffer.from(`${conf.admin.username}:${conf.admin.apiKey}`).toString('base64');
    const api = conf.api;
    const termsAgreement = `/co_t_and_c_agreements.json`;
    const url = `${conf.admin.host}${termsAgreement}`;
    console.log(url);
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
    }else{
      const data = await response.json();
      console.log('Response data:', data);
      return data;
    }
  } catch (e) {
    return {error: e}
  }
}



export async function getPersonId({configuration, user}) {
  try {
    log.debug('getCoManageTerms');

    const conf = configuration.api.authentication['identity'];
    const credentials = Buffer.from(`${conf.admin.username}:${conf.admin.apiKey}`).toString('base64');
    const api = conf.api;
    const person = `/co_people.json?coid=${conf.admin.group}&search.identifier=${user.providerId}`;
    const url = `${conf.admin.host}${person}`;
    console.log(url);
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
      }else{
        return null;
      }
    }
    

  } catch (e) {
    return {error: e}
  }
}
