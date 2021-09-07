/**
 * @file Borchk type definition and resolvers
 *
 * Resolves responses from Borchk
 */

/*
from https://borchk.addi.dk/2.5/borchk.xsd

<xs:simpleType name="statusType">
  <xs:restriction base="xs:string">
    <xs:enumeration value="ok"/>
    <xs:enumeration value="service_not_licensed"/>
    <xs:enumeration value="service_unavailable"/>
    <xs:enumeration value="library_not_found"/>
    <xs:enumeration value="borrowercheck_not_allowed"/>
    <xs:enumeration value="borrower_not_found"/>
    <xs:enumeration value="borrower_not_in_municipality"/>
    <xs:enumeration value="municipality_check_not_supported_by_library"/>
    <xs:enumeration value="no_user_in_request"/>
    <xs:enumeration value="error_in_request"/>
  </xs:restriction>
</xs:simpleType>
 */

import { get } from "lodash";

/**
 * The Request status type definition
 */
export const typeDef = `
enum BorchkRequestStatus {
      ok
      service_not_licensed
      service_unavailable
      library_not_found
      borrowercheck_not_allowed
      borrower_not_found
      borrower_not_in_municipality
      municipality_check_not_supported_by_library
      no_user_in_request
      error_in_request
      internal_error      
    }

type Borchk {
  RequestStatus: BorchkRequestStatus
}`;

/**
 * Resolvers for the Cover type
 * Note that for fields not represented in resolvers, GraphQL
 * uses its default resolver (it looks in parent obj for the field).
 */
export const resolvers = {
  Borchk: {},
};
