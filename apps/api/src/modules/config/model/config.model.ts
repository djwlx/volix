export enum AppConfigEnum {
  cookie_115 = 'cookie_115',
  is_115_picture_caching = 'is_115_picture_caching',
  picture_115_folders = 'picture_115_folders',
  picture_115_random_weights = 'picture_115_random_weights',
  register_email_verify_enabled = 'register_email_verify_enabled',
}

export interface ConfigType {
  config_name: AppConfigEnum;
  config_content: string;
}
