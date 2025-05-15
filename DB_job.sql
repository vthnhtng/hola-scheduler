DELIMITER //

CREATE EVENT IF NOT EXISTS cleanup_old_holidays
ON SCHEDULE EVERY 1 MONTH
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    CREATE TEMPORARY TABLE temp_holidays AS
        SELECT `date` FROM holidays WHERE `date` >= CURDATE() ORDER BY `date`;

    TRUNCATE TABLE holidays;

    INSERT INTO holidays (`date`)
    SELECT `date` FROM temp_holidays;


    DROP TEMPORARY TABLE IF EXISTS temp_holidays;
END;
//

DELIMITER ;
