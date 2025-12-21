CREATE TABLE biz_id_alloc (
  biz_tag      VARCHAR(128) NOT NULL PRIMARY KEY,
  max_id       BIGINT       NOT NULL,
  step         INT          NOT NULL,
  version      BIGINT       NOT NULL,
  update_time  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

