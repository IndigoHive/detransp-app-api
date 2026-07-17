export type ServiceNowFormFieldValue = string | boolean

export type ServiceNowFormAttachment = {
  buffer: Buffer
  originalName: string
  mimetype?: string
}

export type ServiceNowFormInput = {
  nome: string
  cpfOuCnpj: string
  telefone: string
  email: string
  representation: boolean
  attachment?: ServiceNowFormAttachment
} & Record<string, ServiceNowFormFieldValue | ServiceNowFormAttachment | undefined>

export type ServiceNowFormResponse =
  | {
      protocol: string
    }
  | {
      showSnackbar: {
        variant: 'error'
        title: string
        description: string
      }
    }

export type ServiceNowFormFieldType = 'text' | 'boolean'

export type ServiceNowFormFieldDefinition = {
  key: string
  variable: string
  type: ServiceNowFormFieldType
}

export type ServiceNowFormConfig = {
  producerSysId: string
  deployedItem: string
  ioKey: string
  extraStaticVariables?: Record<string, string>
  fields: ServiceNowFormFieldDefinition[]
}
