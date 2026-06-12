package com.clinicai.healthai.util;

import com.clinicai.healthai.entity.Patient;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.clinicai.healthai.entity.WhatsAppMessage;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public class ExcelReaderUtil {

    public static List<Patient> readPatients(InputStream inputStream) {

        List<Patient> patients = new ArrayList<>();

        try {

            Workbook workbook = new XSSFWorkbook(inputStream);

            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {

                Row row = sheet.getRow(i);

                if (row == null) continue;

                Patient patient = new Patient();

                patient.setPatientId(getCellValue(row.getCell(0)));
                patient.setPatientName(getCellValue(row.getCell(1)));
                patient.setPhoneNumber(getCellValue(row.getCell(2)));
                patient.setDisease(getCellValue(row.getCell(3)));
                patient.setFollowupDate(getCellValue(row.getCell(4)));
                patient.setTreatmentStatus(getCellValue(row.getCell(5)));
                patient.setReceptionistNotes(getCellValue(row.getCell(6)));

                patients.add(patient);
            }

            workbook.close();

        } catch (Exception e) {
            e.printStackTrace();
        }

        return patients;
    }
    public static List<WhatsAppMessage> readMessages(InputStream inputStream) {

        List<WhatsAppMessage> messages = new ArrayList<>();

        try {

            Workbook workbook = new XSSFWorkbook(inputStream);

            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {

                Row row = sheet.getRow(i);

                if (row == null) continue;

                WhatsAppMessage message = new WhatsAppMessage();

                message.setPatientId(getCellValue(row.getCell(0)));
                message.setPatientName(getCellValue(row.getCell(1)));
                message.setPhoneNumber(getCellValue(row.getCell(2)));
                message.setMessageDate(getCellValue(row.getCell(3)));
                message.setMessage(getCellValue(row.getCell(4)));

                messages.add(message);
            }

            workbook.close();

        } catch (Exception e) {
            e.printStackTrace();
        }

        return messages;
    }

    private static String getCellValue(Cell cell) {

        if (cell == null) return "";

        switch (cell.getCellType()) {

            case STRING:
                return cell.getStringCellValue().trim();

            case NUMERIC:

                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue()
                            .toLocalDate()
                            .toString();
                }

                return String.valueOf((long) cell.getNumericCellValue());

            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());

            default:
                return "";
        }
    }
}