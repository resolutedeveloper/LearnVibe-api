export interface SubscriptionPlan {
  SubscriptionTitle: string;
  Duration: number; // Duration in months
  NumOfDocuments: number; // Number of allowed documents
  NumOfQuiz: number; // Number of quizzes allowed per document
  AllowedFormats: string; // CSV of allowed formats (e.g., "CSV,PDF,DOC,DOCX")
  NumberOfQuest: string; // CSV of number of questions per quiz (e.g., "10,20,30")
  DifficultyLevels: string; // CSV of allowed difficulty levels (e.g., "Easy,Medium")
  NoOfPages: number; // Maximum pages allowed per document
  IsActive: boolean; // Whether to show in subscription cards
  IsDefault: boolean; // Whether this is the default subscription
  CreatedOn: string; // ISO Date-Time
  CreatedBy: string;
  LastModifiedOn: string; // ISO Date-Time
  LastModifiedBy: string;
}
