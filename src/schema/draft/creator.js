export const typeDef = `
type Draft_Translation {
  """
  Translation in plural form, e.g. forfattere, komponister, instruktører etc.
  """
  plural: String!

  """
  Translation in singular form, e.g. forfatter, komponist, instruktør
  """
  singular: String!
}
type Draft_Role {
  """
  The code for the type of creator or contributor, e.g. 'aut' for author, 'ill' for illustrator etc
  """
  functionCode: String!

  """
  The type of creator/contributor as text in singular and plural in Danish, e.g. forfatter/forfattere, komponist/komponister etc
  """
  function: Draft_Translation!

}
type Draft_Person implements Draft_Subject & Draft_Creator {
  """
  The person's whole name in normal order
  """
  display: String!

  """
  The person's full name inverted
  """
  nameSort: String!

  """
  First name of the person
  """
  firstName: String

  """
  Last name of the person
  """
  lastName: String

  """
  Birth year of the person
  """
  birthYear: String

  """
  A roman numeral added to the person, like Christian IV
  """
  romanNumeral: String

  """
  Added information about the person, like Henri, konge af Frankrig
  """
  attributeToName: String

  """
  Creator aliases, creators behind used pseudonym
  """
  aliases: [Draft_Person!]!

  """
  A list of which kinds of contributions this person made to this creation
  """
  roles: [Draft_Role!]!
}
type Draft_Corporation implements Draft_Subject & Draft_Creator {
    """
    The full corporation or conference name
    """
    display: String!

    """
    The full corporation or conference name to sort after
    """
    nameSort: String!

    """
    Main corporation or conference
    """
    main: String

    """
    Sub corporation or conference/meeting
    """
    sub: String

    """
    Location or jurisdiction of the corporation or conference, like 710 00 *s Københavns Kommune *c Statistisk Kontor
    """
    location: String

    """
    Year of the conference
    """
    year: String

    """
    Number of the conference
    """
    number: String

    """
    Added information about the corporation, like 710 00 *a M. Folmer Andersen *e firma
    """
    attributeToName: String

    """
    A list of which kinds of contributions this corporation made to this creation
    """
    roles: [Draft_Role!]!
}
interface Draft_Creator {
  """
  Name of the creator
  """
  display: String!

  """
  Name of the creator which can be used to sort after 
  """
  nameSort: String!
}
`;

export const resolvers = {};
