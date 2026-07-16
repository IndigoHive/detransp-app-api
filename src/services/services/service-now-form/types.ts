export type ServiceNowFormInput = Record<string, unknown> & {
  attachment?: {
    buffer: Buffer
    originalName: string
    mimetype?: string
  }
}

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
