import { useState, useEffect } from "react";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useTranslation } from "react-i18next";

interface DocumentCategorySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  className?: string;
  "data-testid"?: string;
}

function DocumentCategorySelector({
  value = "",
  onValueChange,
  className,
  "data-testid": dataTestId,
}: DocumentCategorySelectorProps) {
  const [documentCategory, setDocumentCategory] = useState<string>(value);
  const [customDocumentType, setCustomDocumentType] = useState<string>("");
  const [showCustomInput, setShowCustomInput] = useState<boolean>(value === "custom");
  const { t } = useTranslation();
  useEffect(() => {
    const catKey = `selector.${value}`
    if (value != "" && t(catKey) === catKey) {
      setCustomDocumentType(value);
      setDocumentCategory("custom");
      setShowCustomInput(true);
    } else {
      setDocumentCategory(value);
      setShowCustomInput(false);
    }
  }, [value]);
  
  const handleDocumentTypeChange = (value: string) => {
    console.log("Document type changed to: " + value);
    setDocumentCategory(value);
    setShowCustomInput(value === "custom");
    
    if (value !== "custom") {
      console.log("Triggering onValueChange with value: " + value);
      onValueChange(value);
    } else {
      // If custom is selected but no custom value exists yet, don't trigger change
      if (customDocumentType) {
        onValueChange(customDocumentType);
      }
    }
  };
  
  useEffect(() => {
    if (documentCategory === "custom" && customDocumentType) {
      onValueChange(customDocumentType);
    }
  }, [customDocumentType, documentCategory, onValueChange]);

  return (
    <div className={`space-y-3 ${className || ""}`}>
      <Label htmlFor="doc-type">{t("documents.documentType")}</Label>
      <Select
        value={documentCategory}
        onValueChange={handleDocumentTypeChange}
        data-testid={dataTestId || "documentCategorySelector.categorySelect"}
      >
        <SelectTrigger id="doc-type" className="w-full" data-testid={dataTestId ? `${dataTestId}Trigger` : "documentCategorySelector.categorySelectTrigger"}>
          <SelectValue placeholder={t('CreateNewDocumentDialog.selectOrTypeACustomCategory')} />
        </SelectTrigger>
        <SelectContent 
          position="popper" 
          align="center" 
          className="max-h-[400px] overflow-y-auto z-[10005]"
          sideOffset={5}
        >
          <SelectItem value="custom">{t('CreateNewDocumentDialog.enterCustomDocumentCategory')}</SelectItem>
          <SelectGroup>
            <SelectLabel className="sr-only">{t('CreateNewDocumentDialog.custom')}</SelectLabel>
          </SelectGroup>
          
          <SelectGroup>
            <div className="my-2 h-px bg-muted" />
            <SelectLabel className="pl-2 font-bold">{t("commonLabel")}</SelectLabel>
            <SelectItem value="batchrecord" className="pl-6">{t("selector.batchrecord")}</SelectItem>
            <SelectItem value="validation" className="pl-6">{t("selector.validation")}</SelectItem>
            <SelectItem value="logbook" className="pl-6">{t("selector.logbook")}</SelectItem>
            <SelectItem value="deviation" className="pl-6">{t("selector.deviation")}</SelectItem>
            <SelectItem value="nonconform" className="pl-6">{t("selector.nonconform")}</SelectItem>
          </SelectGroup>
          
          <SelectGroup>
            <div className="my-2 h-px bg-muted" />
            <SelectLabel className="pl-2 font-bold">{t("otherLabel")}</SelectLabel>
            <SelectItem value="analyticalmethods" className="pl-6">{t("selector.analyticalmethods")}</SelectItem>
            <SelectItem value="selfinspection" className="pl-6">{t("selector.selfinspection")}</SelectItem>
            <SelectItem value="supplysources" className="pl-6">{t("selector.supplysources")}</SelectItem>
            <SelectItem value="bom" className="pl-6">{t("selector.bom")}</SelectItem>
            <SelectItem value="capa" className="pl-6">{t("selector.capa")}</SelectItem>
            <SelectItem value="changemanagement" className="pl-6">{t("selector.changemanagement")}</SelectItem>
            <SelectItem value="clinicalstudyrecord" className="pl-6">{t("selector.clinicalstudyrecord")}</SelectItem>
            <SelectItem value="coldchain" className="pl-6">{t("selector.coldchain")}</SelectItem>
            <SelectItem value="complaints" className="pl-6">{t("selector.complaints")}</SelectItem>
            <SelectItem value="continuousimprovements" className="pl-6">{t("selector.continuousimprovements")}</SelectItem>
            <SelectItem value="coa" className="pl-6">{t("selector.coa")}</SelectItem>
            <SelectItem value="coc" className="pl-6">{t("selector.coc")}</SelectItem>
            <SelectItem value="distributionrecord" className="pl-6">{t("selector.distributionrecord")}</SelectItem>
            <SelectItem value="labbook" className="pl-6">{t("selector.labbook")}</SelectItem>
            <SelectItem value="policy" className="pl-6">{t("selector.policy")}</SelectItem>
            <SelectItem value="qualitymanagementrecord" className="pl-6">{t("selector.qualitymanagementrecord")}</SelectItem>
            <SelectItem value="qualitytechnicalagreement" className="pl-6">{t("selector.qualitytechnicalagreement")}</SelectItem>
            <SelectItem value="recall" className="pl-6">{t("selector.recall")}</SelectItem>
            <SelectItem value="release" className="pl-6">{t("selector.release")}</SelectItem>
            <SelectItem value="saereport" className="pl-6">{t("selector.saereport")}</SelectItem>
            <SelectItem value="sourcesuppliers" className="pl-6">{t("selector.sourcesuppliers")}</SelectItem>
            <SelectItem value="testMethod" className="pl-6">{t("selector.testMethod")}</SelectItem>
            <SelectItem value="trainingrecord" className="pl-6">{t("selector.trainingrecord")}</SelectItem>
            <SelectItem value="workinstructions" className="pl-6">{t("selector.workinstructions")}</SelectItem>
            <SelectItem value="workflow" className="pl-6">{t("selector.workflow")}</SelectItem>
            <SelectItem value="procedures" className="pl-6">{t("selector.procedures")}</SelectItem>
            <SelectItem value="sops" className="pl-6">{t("selector.sops")}</SelectItem>
            <SelectItem value="workplacesafety" className="pl-6">{t("selector.workplacesafety")}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      
      {showCustomInput && (
        <div className="mt-3">
          <Input
            id="custom-doc-type"
            placeholder={t('CreateNewDocumentDialog.typeCustomCategoryHere')}
            value={customDocumentType}
            onChange={(e) => {
              setCustomDocumentType(e.target.value)
            }}
            data-testid={dataTestId ? `${dataTestId}CustomInput` : "documentCategorySelector.customCategoryInput"}
          />
        </div>
      )}
    </div>
  );
}
export default DocumentCategorySelector;
